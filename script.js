const firebaseConfig = {
    apiKey: "AIzaSyCjZ8eZet3qW53LVqpSP_B21NdY5fH_pfg",
    authDomain: "bara2024-a6eb8.firebaseapp.com",
    databaseURL: "https://bara2024-a6eb8-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "bara2024-a6eb8",
    storageBucket: "bara2024-a6eb8.appspot.com",
    messagingSenderId: "647208776082",
    appId: "1:647208776082:web:df62c25fca4ebef478d14b",
    measurementId: "G-PWZ269MVD8"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();
const auth = firebase.auth();

let currentUser = null;
let isAdmin = false;

auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        user.getIdTokenResult().then(idTokenResult => {
            isAdmin = !!idTokenResult.claims.admin;
            setupUI();
            fetchGalleryImages();
        });
    } else {
        setupUI();
        fetchAllGalleryImages(); // Fetch all images for La Famille Galerie
    }
});

function setupUI() {
    if (currentUser) {
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('authSection').style.display = 'none';
        if (isAdmin) {
            document.getElementById('adminGallerySection').style.display = 'block';
        } else {
            document.getElementById('adminGallerySection').style.display = 'none';
        }
    } else {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('adminGallerySection').style.display = 'none';
    }
}

function validateEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
}

function signup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!validateEmail(email)) {
        alert('Invalid email format. Please enter a valid email.');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            alert('Signup successful');
        })
        .catch(error => {
            alert('Signup failed: ' + error.message);
        });
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            alert('Login successful');
        })
        .catch(error => {
            alert('Login failed: ' + error.message);
        });
}

function googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log(result);
            alert('Google Sign-In successful');
        })
        .catch((error) => {
            console.error(error);
            alert('Google Sign-In failed: ' + error.message);
        });
}

function logout() {
    auth.signOut()
        .then(() => {
            alert('Logged out successfully');
        })
        .catch(error => {
            alert('Logout failed: ' + error.message);
        });
}

function disableUploadButton(button, duration) {
    button.disabled = true;
    setTimeout(() => {
        button.disabled = false;
    }, duration);
}

function uploadImage() {
    const input = document.getElementById('imageUpload');
    const uploadButton = document.querySelector('#uploadForm button');
    if (input.files && input.files[0]) {
        const file = input.files[0];

        const storageRef = storage.ref();
        const fileRef = storageRef.child(`images/${Date.now()}_${file.name}`);

        // Ensure the user is authenticated
        if (!currentUser) {
            alert('You must be logged in to upload an image.');
            return;
        }

        fileRef.put(file)
            .then(snapshot => {
                return snapshot.ref.getDownloadURL();
            })
            .then(downloadURL => {
                console.log('File available at', downloadURL);
                const timestamp = Date.now();

                const newImageRef = database.ref('galleryImages').push();
                newImageRef.set({
                    url: downloadURL,
                    timestamp: timestamp,
                    user: currentUser.uid // Store user ID
                });

                disableUploadButton(uploadButton, 30000);
                fetchMyGalleryImages(); // Refresh user's gallery after upload
            })
            .catch(error => {
                console.error('Error uploading file:', error);
                alert('Error uploading file: ' + error.message);
            });
    }
}

function fetchMyGalleryImages() {
    console.log('Fetching my gallery images.');
    const myGallery = document.getElementById('myGallery');
    myGallery.innerHTML = ''; // Clear the gallery

    database.ref('galleryImages').orderByChild('user').equalTo(currentUser.uid).once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const data = childSnapshot.val();
            const img = document.createElement('img');
            img.src = data.url;

            const imageContainer = document.createElement('div');
            imageContainer.appendChild(img);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button'); // Add the class for styling
            deleteButton.innerText = 'Delete';
            deleteButton.onclick = () => {
                if (confirm('Are you sure you want to delete this image?')) {
                    deleteImage(childSnapshot.key, img, deleteButton);
                }
            };
            imageContainer.appendChild(deleteButton);

            myGallery.appendChild(imageContainer);
        });
    });
}

function fetchGalleryImages() {
    if (isAdmin) {
        fetchAdminGalleryImages();
    } else {
        fetchMyGalleryImages();
    }
}

function fetchAdminGalleryImages() {
    console.log('Fetching all gallery images for admin.');
    const adminGallery = document.getElementById('adminGallery');
    adminGallery.innerHTML = ''; // Clear the gallery

    database.ref('galleryImages').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const data = childSnapshot.val();
            const img = document.createElement('img');
            img.src = data.url;

            const imageContainer = document.createElement('div');
            imageContainer.appendChild(img);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button'); // Add the class for styling
            deleteButton.innerText = 'Delete';
            deleteButton.onclick = () => {
                if (confirm('Are you sure you want to delete this image?')) {
                    deleteImage(childSnapshot.key, img, deleteButton);
                }
            };
            imageContainer.appendChild(deleteButton);

            adminGallery.appendChild(imageContainer);
        });
    });
}

function fetchAllGalleryImages() {
    console.log('Fetching all gallery images.');
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; // Clear the gallery

    database.ref('galleryImages').once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const data = childSnapshot.val();
            const img = document.createElement('img');
            img.src = data.url;

            const imageContainer = document.createElement('div');
            imageContainer.appendChild(img);

            gallery.appendChild(imageContainer);
        });
    });
}

function deleteImage(key, imgElement, deleteButton) {
    database.ref('galleryImages/' + key).remove()
        .then(() => {
            imgElement.parentNode.remove();
            console.log('Image deleted.');
        })
        .catch(error => {
            console.error('Error deleting image:', error);
        });
}

document.getElementById('googleSignInButton').addEventListener('click', googleSignIn);

document.addEventListener('DOMContentLoaded', () => {
    fetchAllGalleryImages();
});
