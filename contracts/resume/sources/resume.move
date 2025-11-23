module resume::resume {
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::package;
    use sui::display;
    use std::vector;
    use sui::event;
    use sui::clock::{Self, Clock};

    // --- Errors ---
    const ENotOwner: u64 = 0;

    // --- Structs ---

    /// OTW for Display
    struct RESUME has drop {}

    struct Resume has key, store {
        id: UID,
        owner: address,
        name: String,
        title: String,
        introduction: String, 
        avatar: Option<String>,
        attachment: Option<String>,
    }

    struct Registry has key {
        id: UID,
        profiles: vector<ID>,
    }

    struct Message has key, store {
        id: UID,
        recipient: address,
        sender: address,
        content_blob_id: String,
        is_encrypted: bool,
        timestamp: u64,
    }

    // --- Events ---
    struct ProfileCreated has copy, drop {
        id: ID,
        owner: address,
    }

    struct MessageSent has copy, drop {
        id: ID,
        sender: address,
        recipient: address,
    }

    // --- Init ---

    fun init(otw: RESUME, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        
        // Setup Display
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"link"),
            string::utf8(b"project_name"),
        ];

        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{introduction}"),
            string::utf8(b"{avatar}"), 
            string::utf8(b"https://sui-resume.com/profile/{id}"),
            string::utf8(b"SuiResume"),
        ];

        let display = display::new_with_fields<Resume>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));

        transfer::share_object(Registry {
            id: object::new(ctx),
            profiles: vector::empty(),
        });
    }

    // --- Public Functions ---

    public entry fun create_profile(
        registry: &mut Registry,
        name: String,
        title: String,
        introduction: String,
        avatar: Option<String>,
        attachment: Option<String>,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let resume = Resume {
            id,
            owner: tx_context::sender(ctx),
            name,
            title,
            introduction,
            avatar,
            attachment,
        };

        let resume_id = object::id(&resume);
        vector::push_back(&mut registry.profiles, resume_id);

        event::emit(ProfileCreated {
            id: resume_id,
            owner: tx_context::sender(ctx),
        });

        transfer::transfer(resume, tx_context::sender(ctx));
    }

    public entry fun update_profile(
        resume: &mut Resume,
        name: String,
        title: String,
        introduction: String,
        avatar: Option<String>,
        attachment: Option<String>,
        ctx: &mut TxContext
    ) {
        assert!(resume.owner == tx_context::sender(ctx), ENotOwner);
        resume.name = name;
        resume.title = title;
        resume.introduction = introduction;
        resume.avatar = avatar;
        resume.attachment = attachment;
    }

    public entry fun send_message(
        recipient: address,
        content_blob_id: vector<u8>,
        is_encrypted: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        let message = Message {
            id: object::new(ctx),
            recipient,
            sender,
            content_blob_id: string::utf8(content_blob_id),
            is_encrypted,
            timestamp: clock::timestamp_ms(clock),
        };

        event::emit(MessageSent {
            id: object::uid_to_inner(&message.id),
            sender,
            recipient,
        });

        transfer::transfer(message, recipient);
    }
}
