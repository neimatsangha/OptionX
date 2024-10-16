module optionx::option_vault {
    use std::signer;
    use std::vector;
    use std::option::{Self, Option};
    use std::string::{Self as String, String};
    use std::error;
    use std::u64;
    use std::address;
    use std::event::{Self as Event, EventHandle};
    use aptos_framework::timestamp;
    use aptos_framework::fungible_asset::{Self as FA, FungibleAsset, FungibleStore};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_token_objects::token::{Self as Token, Token};
    use aptos_token_objects::collection::{Self as Collection, Collection};
    use aptos_token_objects::property_map;
    use aptos_token_objects::royalty;
    use aptos_framework::object;

    /// Error codes
    const E_OPTION_NOT_FOUND: u64 = 1;
    const E_NOT_OPTION_OWNER: u64 = 2;
    const E_OPTION_ALREADY_EXPIRED: u64 = 3;
    const E_OPTION_NOT_EXPIRED: u64 = 4;
    const E_COLLECTION_NOT_PUBLISHED: u64 = 5;
    const E_NOT_AUTHORIZED: u64 = 6;

    /// Event emitted when a new option is created
    struct OptionCreatedEvent has copy, drop, store {
        option_id: u64,
        writer: address,
    }

    /// Event emitted when an option is exercised
    struct OptionExercisedEvent has copy, drop, store {
        option_id: u64,
        buyer: address,
    }

    /// Event emitted when an option expires
    struct OptionExpiredEvent has copy, drop, store {
        option_id: u64,
    }

    /// Struct holding event handles
    struct OptionEvents has key {
        option_created_events: EventHandle<OptionCreatedEvent>,
        option_exercised_events: EventHandle<OptionExercisedEvent>,
        option_expired_events: EventHandle<OptionExpiredEvent>,
    }

    /// The main Option struct
    struct Option has key {
        id: u64,
        writer: address,
        buyer: Option<address>,
        strike_price: u64,
        premium: u64,
        collateral: u64,
        expiration_time: u64,
        is_exercised: bool,
    }

    /// Resource holding all options
    struct Options has key {
        options: vector<Option>,
        next_option_id: u64,
    }

    /// Initializes the module for the admin
    public fun initialize(admin: &signer) {
        let admin_address = signer::address_of(admin);
        move_to(
            admin,
            OptionEvents {
                option_created_events: Event::new_event_handle<OptionCreatedEvent>(admin),
                option_exercised_events: Event::new_event_handle<OptionExercisedEvent>(admin),
                option_expired_events: Event::new_event_handle<OptionExpiredEvent>(admin),
            },
        );
        move_to(
            admin,
            Options {
                options: vector::empty<Option>(),
                next_option_id: 0,
            },
        );
    }

    /// Creates a new option
    public fun create_option(
        writer: &signer,
        strike_price: u64,
        premium: u64,
        collateral: u64,
        expiration_time: u64,
    ) {
        let writer_address = signer::address_of(writer);
        let options_ref = borrow_global_mut<Options>(writer_address);

        let option_id = options_ref.next_option_id;
        options_ref.next_option_id = option_id + 1;

        let option = Option {
            id: option_id,
            writer: writer_address,
            buyer: Option::none<address>(),
            strike_price,
            premium,
            collateral,
            expiration_time,
            is_exercised: false,
        };

        vector::push_back(&mut options_ref.options, option);

        // Mint the Option NFT to the writer
        option_nft::mint_option_nft(writer, option_id);

        // Emit event
        let option_events_ref = borrow_global_mut<OptionEvents>(writer_address);
        Event::emit_event(
            &mut option_events_ref.option_created_events,
            OptionCreatedEvent {
                option_id,
                writer: writer_address,
            },
        );
    }

    /// Allows a buyer to purchase an option
    public fun purchase_option(buyer: &signer, writer_address: address, option_id: u64) {
        let buyer_address = signer::address_of(buyer);
        let options_ref = borrow_global_mut<Options>(writer_address);
        let option_ref = find_option_mut(&mut options_ref.options, option_id);

        assert!(
            option_ref.buyer.is_none(),
            E_NOT_AUTHORIZED
        );

        // Transfer premium from buyer to writer
        let premium_fa = FA::withdraw<AptosCoin>(buyer, option_ref.premium);
        FA::deposit<AptosCoin>(writer_address, premium_fa);

        // Update buyer in the option
        option_ref.buyer = Option::some(buyer_address);

        // Transfer the Option NFT to the buyer
        option_nft::transfer_option_nft(
            &signer::address_of(writer_address),
            buyer_address,
            option_id,
        );
    }

    /// Allows the buyer to exercise the option
    public fun exercise_option(buyer: &signer, writer_address: address, option_id: u64) {
        let buyer_address = signer::address_of(buyer);
        let options_ref = borrow_global_mut<Options>(writer_address);
        let option_ref = find_option_mut(&mut options_ref.options, option_id);

        assert!(
            option_ref.buyer == Option::some(buyer_address),
            E_NOT_OPTION_OWNER
        );
        assert!(
            !option_ref.is_exercised,
            E_OPTION_ALREADY_EXPIRED
        );
        assert!(
            timestamp::now_seconds() <= option_ref.expiration_time,
            E_OPTION_ALREADY_EXPIRED
        );

        // Transfer strike price from buyer to writer
        let strike_fa = FA::withdraw<AptosCoin>(buyer, option_ref.strike_price);
        FA::deposit<AptosCoin>(writer_address, strike_fa);

        // Transfer collateral from writer to buyer
        let collateral_fa = FA::withdraw<AptosCoin>(writer_address, option_ref.collateral);
        FA::deposit<AptosCoin>(buyer_address, collateral_fa);

        option_ref.is_exercised = true;

        // Burn the Option NFT
        option_nft::burn_option_nft(buyer, option_id);

        // Emit event
        let option_events_ref = borrow_global_mut<OptionEvents>(writer_address);
        Event::emit_event(
            &mut option_events_ref.option_exercised_events,
            OptionExercisedEvent {
                option_id,
                buyer: buyer_address,
            },
        );
    }

    /// Expires the option if it's past the expiration time and not exercised
    public fun expire_option(writer: &signer, option_id: u64) {
        let writer_address = signer::address_of(writer);
        let options_ref = borrow_global_mut<Options>(writer_address);
        let option_ref = find_option_mut(&mut options_ref.options, option_id);

        assert!(
            !option_ref.is_exercised,
            E_OPTION_ALREADY_EXPIRED
        );
        assert!(
            timestamp::now_seconds() > option_ref.expiration_time,
            E_OPTION_NOT_EXPIRED
        );

        // Return collateral to writer
        // No need to transfer since collateral was held by the writer

        // Burn the Option NFT
        if (Option::is_some(&option_ref.buyer)) {
            let buyer_address_ref = Option::borrow(&option_ref.buyer);
            let buyer_address = *buyer_address_ref;
            option_nft::burn_option_nft(&buyer_address, option_id);
        } else {
            option_nft::burn_option_nft(writer, option_id);
        }

        // Remove option from storage
        remove_option(&mut options_ref.options, option_id);

        // Emit event
        let option_events_ref = borrow_global_mut<OptionEvents>(writer_address);
        Event::emit_event(
            &mut option_events_ref.option_expired_events,
            OptionExpiredEvent { option_id },
        );
    }

    /// Helper function to find an option by ID
    fun find_option_mut(
        options: &mut vector<Option>,
        option_id: u64,
    ): &mut Option {
        let len = vector::length(options);
        let i = 0;
        while (i < len) {
            let option_ref = vector::borrow_mut(options, i);
            if (option_ref.id == option_id) {
                return option_ref;
            }
            i = i + 1;
        }
        abort E_OPTION_NOT_FOUND;
    }

    fun remove_option(options: &mut vector<Option>, option_id: u64) {
        let len = vector::length(options);
        let mut i = 0;
        while (i < len) {
            let option_ref = &options[i];
            if (option_ref.id == option_id) {
                vector::remove(options, i);
                return;
            }
            i = i + 1;
        }
        abort E_OPTION_NOT_FOUND;
    }
}
