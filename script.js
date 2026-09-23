import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


const firebaseConfig = {
    apiKey: "AIzaSyB5mTbNbHoy4MOJ8KEZMavdxl5lS5eTzkw",
    authDomain: "iskola-pet.firebaseapp.com",
    databaseURL: "https://iskola-pet-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "iskola-pet",
    storageBucket: "iskola-pet.firebasestorage.app",
    messagingSenderId: "441611015098",
    appId: "1:441611015098:web:66ab9566ca7d0695ed8383"
};


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const palackokRef = ref(database, "palackok");
const tbody = document.querySelector("#tbody");

onValue(palackokRef, (snapshot) => {
    const data = snapshot.val();
    tbody.innerHTML = "";
    if (!data) {
        return;
    }
    console.log("Firebase adat:", data);
    Object.values(data).forEach(palack => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${palack.nev ?? ""}</td>
            <td>${palack.osztaly ?? ""}</td>
            <td>${palack.darab ?? ""}</td>
        `;
        tbody.appendChild(tr);
    });
});

