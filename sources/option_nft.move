module optionx::option_nft {
    use std::signer;
    use std::address;
    use std::string::{Self as String, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::object;
    use aptos_framework::event;
    use std::error;
    use aptos_token_objects::collection::{Self as Collection, Collection};
    use aptos_token_objects::token::{Self as Token, Token};

    const E_COLLECTION_NOT_PUBLISHED: u64 = 1;

    /// Initializes the OptionX NFT collection for the creator
    public fun initialize_collection(creator: &signer) {
        let collection_name = String::utf8(b"OptionX Options");
        let description = String::utf8(b"Collection of OptionX Option NFTs");
        let uri = String::utf8(b"");

        Collection::create_collection(
            creator,
            &collection_name,
            &description,
            &uri,
        );
    }

    /// Mints an Option NFT
    public fun mint_option_nft(
        creator: &signer,
        option_id: u64,
    ) {
        let collection_name = String::utf8(b"OptionX Options");
        let token_name = String::concat(String::utf8(b"Option #"), u64_to_string(option_id));

        // Ensure collection exists
        let collection_exists = Collection::exists_collection(
            signer::address_of(creator),
            &collection_name,
        );
        assert!(collection_exists, E_COLLECTION_NOT_PUBLISHED);

        Token::create_token(
            creator,
            &collection_name,
            &token_name,
            &String::utf8(b"Option NFT"),
            &String::utf8(b""),
        );
    }

    /// Transfers an Option NFT
    public fun transfer_option_nft(
        sender: &signer,
        recipient: address,
        option_id: u64,
    ) {
        let collection_name = String::utf8(b"OptionX Options");
        let token_name = String::concat(String::utf8(b"Option #"), u64_to_string(option_id));

        Token::transfer(
            sender,
            &collection_name,
            &token_name,
            1,
            recipient,
        );
    }

    /// Burns an Option NFT
    public fun burn_option_nft(
        owner: &signer,
        option_id: u64,
    ) {
        let collection_name = String::utf8(b"OptionX Options");
        let token_name = String::concat(String::utf8(b"Option #"), u64_to_string(option_id));

        Token::burn(
            owner,
            &collection_name,
            &token_name,
            1,
        );
    }

    /// Helper function to convert u64 to string
    fun u64_to_string(value: u64): String {
        integer::to_string(value)
    }
}