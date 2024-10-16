module optionx::marketplace {
    use std::signer;
    use std::vector;
    use std::string::{Self as String, String};
    use std::error;
    use std::u64;
    use std::address;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::fungible_asset::{Self as FA, FungibleAsset};
    use aptos_framework::object;
    use aptos_token_objects::token::{Self as Token, Token};
    use aptos_token_objects::collection::{Self as Collection, Collection};

    /// Error codes
    const E_LISTING_NOT_FOUND: u64 = 1;
    const E_NOT_AUTHORIZED: u64 = 2;
    const E_LISTING_INACTIVE: u64 = 3;

    struct Listing has key {
        option_id: u64,
        seller: address,
        price: u64,
        is_active: bool,
    }

    struct Listings has key {
        listings: vector<Listing>,
    }

    /// Initializes the marketplace
    public fun initialize(admin: &signer) {
        let admin_address = signer::address_of(admin);
        move_to(
            admin,
            Listings {
                listings: vector::empty<Listing>(),
            },
        );
    }

    /// Lists an Option NFT for sale
    public fun list_option_for_sale(
        seller: &signer,
        option_id: u64,
        price: u64,
    ) {
        let seller_address = signer::address_of(seller);
        let listings_ref = borrow_global_mut<Listings>(seller_address);

        // Transfer the Option NFT to the marketplace (self)
        option_nft::transfer_option_nft(
            seller,
            address_of<Self>(),
            option_id,
        );

        let listing = Listing {
            option_id,
            seller: seller_address,
            price,
            is_active: true,
        };

        vector::push_back(&mut listings_ref.listings, listing);
    }

    /// Purchases an Option NFT
    public fun purchase_option(
        buyer: &signer,
        seller_address: address,
        option_id: u64,
    ) {
        let buyer_address = signer::address_of(buyer);
        let listings_ref = borrow_global_mut<Listings>(seller_address);
        let listing_ref = find_listing_mut(&mut listings_ref.listings, option_id);

        assert!(listing_ref.is_active, E_LISTING_INACTIVE);

        // Transfer payment from buyer to seller
        let payment_fa = FA::withdraw<AptosCoin>(buyer, listing_ref.price);
        FA::deposit<AptosCoin>(seller_address, payment_fa);

        // Transfer the Option NFT to the buyer
        option_nft::transfer_option_nft(
            &address_of<Self>(),
            buyer_address,
            option_id,
        );

        // Mark listing as inactive
        listing_ref.is_active = false;
    }

    /// Removes an active listing
    public fun remove_listing(
        seller: &signer,
        option_id: u64,
    ) {
        let seller_address = signer::address_of(seller);
        let listings_ref = borrow_global_mut<Listings>(seller_address);
        let listing_ref = find_listing_mut(&mut listings_ref.listings, option_id);

        assert!(listing_ref.is_active, E_LISTING_INACTIVE);

        // Transfer the Option NFT back to the seller
        option_nft::transfer_option_nft(
            &address_of<Self>(),
            seller_address,
            option_id,
        );

        // Mark listing as inactive
        listing_ref.is_active = false;
    }

    /// Helper function to find a listing by option ID
    fun find_listing_mut(
        listings: &mut vector<Listing>,
        option_id: u64,
    ): &mut Listing {
        let len = vector::length(listings);
        let i = 0;
        while (i < len) {
            let listing_ref = vector::borrow_mut(listings, i);
            if (listing_ref.option_id == option_id) {
                return listing_ref;
            }
            i = i + 1;
        }
        abort E_LISTING_NOT_FOUND;
    }
}