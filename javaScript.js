const SUPABASE_URL = "https://jlqmkrhtvhamvlpoiffb.supabase.co";
const SUPABASE_KEY = "sb_publishable_4k3DZC-BM89C2uiZiDSvLg_3SnyvLHR";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


const itemForm = document.getElementById("item-form");

if (itemForm) {

    const itemName = document.getElementById("item-name");
    const itemCategory = document.getElementById("item-category");
    const itemLocation = document.getElementById("item-location");
    const itemDate = document.getElementById("item-date");
    const itemContact = document.getElementById("item-contact");
    const itemImage = document.getElementById("item-image");
    const imagePreview = document.getElementById("image-preview");

    itemImage.addEventListener("change", function () {

        const file = itemImage.files[0];

        if (file) {
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = "block";
        }

    });

    itemForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const file = itemImage.files[0];

        if (!file) {
            alert("Please upload an image!");
            return;
        }

        const submitButton = itemForm.querySelector("button[type='submit']");
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        try {

            const fileName = Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

            const { error: uploadError } = await supabaseClient
                .storage
                .from("item-images")
                .upload(fileName, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: imageData } = supabaseClient
                .storage
                .from("item-images")
                .getPublicUrl(fileName);

            const newItem = {
                name: itemName.value,
                category: itemCategory.value,
                location: itemLocation.value,
                date: itemDate.value,
                contact: itemContact.value,
                image_url: imageData.publicUrl
            };

            const { error: insertError } = await supabaseClient
                .from("items")
                .insert([newItem]);

            if (insertError) {
                throw insertError;
            }

            alert("Your item has been submitted successfully!");

            itemForm.reset();
            imagePreview.src = "";
            imagePreview.style.display = "none";

        } catch (error) {

            console.error(error);
            alert("Something went wrong: " + error.message);

        }

        submitButton.disabled = false;
        submitButton.textContent = "SUBMIT";

    });

}


const itemsContainer = document.querySelector(".items-container");

if (itemsContainer) {

    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const categorySelect = document.getElementById("category-select");
    const noResults = document.getElementById("no-results");

    function searchItems() {

        const searchValue = searchInput.value.toLowerCase();
        const selectedCategory = categorySelect.value;

        const itemCards = document.querySelectorAll(".item-card");

        let foundItems = 0;

        itemCards.forEach(function (card) {

            const itemName = card.querySelector("h3").textContent.toLowerCase();
            const itemCategory = card.getAttribute("data-category");

            if (
                itemName.includes(searchValue) &&
                (selectedCategory === "" || itemCategory === selectedCategory)
            ) {

                card.style.display = "block";
                foundItems++;

            } else {

                card.style.display = "none";

            }

        });

        noResults.style.display = foundItems === 0 ? "block" : "none";

    }


    async function loadItems() {

        const { data: items, error } = await supabaseClient
            .from("items")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error loading items:", error);
            alert("Could not load online items.");
            return;
        }

        items.forEach(function (item) {

            const newCard = document.createElement("div");
            newCard.className = "item-card";
            newCard.setAttribute("data-category", item.category);

            const image = document.createElement("img");
            image.src = item.image_url;
            image.alt = item.name;

            const name = document.createElement("h3");
            name.textContent = item.name;

            const category = document.createElement("p");
            category.textContent = "Category: " + item.category;

            const location = document.createElement("p");
            location.textContent = "Location: " + item.location;

            const date = document.createElement("p");
            date.textContent = "Date Found: " + item.date;

            const contactButton = document.createElement("button");
            contactButton.textContent = "Contact Finder";

            contactButton.addEventListener("click", function () {
                alert("Contact Details: " + item.contact);
            });

            newCard.appendChild(image);
            newCard.appendChild(name);
            newCard.appendChild(category);
            newCard.appendChild(location);
            newCard.appendChild(date);
            newCard.appendChild(contactButton);

            itemsContainer.appendChild(newCard);

        });

        searchItems();

    }


    searchButton.addEventListener("click", searchItems);
    searchInput.addEventListener("input", searchItems);
    categorySelect.addEventListener("change", searchItems);

    loadItems();

}