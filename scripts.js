// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDeO300ZHcSaz3u5bzTQKX8w1Z73PHtNwE",
  authDomain: "controlacp-ebb07.firebaseapp.com",
  databaseURL: "https://controlacp-ebb07-default-rtdb.firebaseio.com",
  projectId: "controlacp-ebb07",
  storageBucket: "controlacp-ebb07.firebasestorage.app",
  messagingSenderId: "592369872670",
  appId: "1:592369872670:web:da68a68d8e1e3ab9cb230f"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a la base de datos
const database = firebase.database();
const usersRef = database.ref("ACP/usuarios");
const gateRef = database.ref("ACP/led1");

// Variables y referencias
const condoName = "ACP";
document.getElementById("condo-name").textContent = condoName;
const toggleButton = document.getElementById("toggle-button");
const nameInput = document.getElementById("name");
const registerButton = document.getElementById("register-button");
const infoText = document.getElementById("info-text");
let currentUser = null;
let buttonPressed = false;
let gateOpenedInTime = false;
let gateTimeout = null;

// Al cargar la página, verificar si el nombre está almacenado en localStorage
window.addEventListener("load", () => {
  const storedName = localStorage.getItem("userName"); // Recuperar el nombre almacenado
  if (storedName) {
    checkUserInDatabase(storedName); // Verificar el usuario en la base de datos
  } else {
    // Mostrar el contenedor de registro si no hay nombre almacenado
    document.getElementById("registro-container").classList.remove("hidden");
  }
});

// Verificar el nombre del usuario en la base de datos
function checkUserInDatabase(name) {
  usersRef.child(name).once("value").then(snapshot => {
    const usuario = snapshot.val();
    if (usuario) {
      currentUser = usuario;

      if (usuario.fase) {
        toggleButton.disabled = false;
        toggleButton.classList.remove("hidden");
        document.getElementById("registro-container").classList.add("hidden"); // Ocultar contenedor de registro
      } else {
        toggleButton.classList.remove("hidden");
        usersRef.child(name).on("value", snapshot => {
          const updatedUser = snapshot.val();
          if (updatedUser && updatedUser.fase) {
            toggleButton.disabled = false;
            toggleButton.classList.remove("hidden");
            document.getElementById("registro-container").classList.add("hidden");
            infoText.style.display = "none";
            currentUser = updatedUser;
          } else if (updatedUser && !updatedUser.fase) {
            toggleButton.disabled = true;
            infoText.style.display = "block";
            currentUser = updatedUser;
          }
        });
      }
    } else {
      document.getElementById("registro-container").classList.remove("hidden"); // Mostrar contenedor de registro
    }
  }).catch(error => {
    console.error("Error al verificar el registro del usuario:", error);
    // Mostrar contenedor de registro en caso de error
    document.getElementById("registro-container").classList.remove("hidden");
  });
}

// Registrar usuario y almacenar el nombre en localStorage
registerButton.addEventListener("click", () => {
  const name = nameInput.value.trim(); // Eliminar espacios adicionales

  if (name) {
    usersRef.child(name).once("value").then(snapshot => {
      const usuario = snapshot.val();
      if (usuario) {
        alert("El nombre ya está en uso. Por favor, elija otro nombre.");
      } else {
        usersRef.child(name).set({
          nombre: name,
          fase: false,
          esAdmin: false
        }).then(() => {
          // Guardar el nombre en localStorage
          localStorage.setItem("userName", name);

          if (confirm("Usuario registrado con éxito.")) {
            document.getElementById("registro-container").classList.add("hidden");
            toggleButton.classList.remove("hidden");
            infoText.style.display = "block";

            usersRef.child(name).on("value", snapshot => {
              const updatedUser = snapshot.val();
              if (updatedUser && updatedUser.fase) {
                toggleButton.disabled = false;
                toggleButton.classList.remove("hidden");
                document.getElementById("registro-container").classList.add("hidden");
                infoText.style.display = "none";
                currentUser = updatedUser;
                location.reload();
              } else if (updatedUser && !updatedUser.fase) {
                toggleButton.disabled = true;
                infoText.style.display = "block";
                currentUser = updatedUser;
              }
            });
          }
        }).catch(error => {
          console.error("Error al registrar usuario:", error);
        });
      }
    });
  } else {
    alert("Por favor, completa el campo de nombre");
  }
});

// Monitorear cambios en la variable del portón
gateRef.on("value", snapshot => {
  const gateState = snapshot.val();
  if (buttonPressed) {
    if (gateState === 0) {
      clearTimeout(gateTimeout);
      toggleButton.disabled = false;
      buttonPressed = false;
    } else if (gateState === 1) {
      toggleButton.disabled = true;
      gateOpenedInTime = false;

      gateTimeout = setTimeout(() => {
        if (!gateOpenedInTime) {
          resetGateState();
          alert("El portón no se abrió a tiempo. Intenta nuevamente.");
        }
      }, 10000);
    }
  }
});

// Restablecer el estado del portón
function resetGateState() {
  gateRef.set(0).then(() => {
    console.log("Estado del portón restablecido");
    toggleButton.disabled = false;
    buttonPressed = false;
  }).catch(error => {
    console.error("Error al restablecer el estado del portón:", error);
  });
}

// Cambiar el estado del portón al hacer clic en el botón
toggleButton.addEventListener("click", () => {
  usersRef.child(currentUser.nombre).once("value").then(snapshot => {
    const currentUserData = snapshot.val();
    if (currentUserData && currentUserData.fase) {
      toggleButton.disabled = true;

      gateRef.once("value").then(snapshot => {
        const currentState = snapshot.val();
        gateRef.set(currentState === 1 ? 0 : 1).then(() => {
          console.log("Estado del portón actualizado en Firebase");
          clearTimeout(gateTimeout);
          gateOpenedInTime = false;
          buttonPressed = true;

          gateTimeout = setTimeout(() => {
            if (!gateOpenedInTime) {
              resetGateState();
              alert("El portón no se abrió a tiempo. Intenta nuevamente.");
            }
          }, 10000);
        }).catch(error => {
          console.error("Error al actualizar el estado del portón:", error);
        });
      });
    } else {
      alert("Usuario no habilitado.");
    }
  });
});
