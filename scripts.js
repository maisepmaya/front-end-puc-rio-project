const modal = document.getElementById("modal");
let sheetObject = {};
let cardObject = {};

let blockCreate = false;

// /*
//   --------------------------------------------------------------------------------------
//   API
//   --------------------------------------------------------------------------------------
// */

const getAllSheetAPI = async () => {
  let url = "http://127.0.0.1:5000/sheet/getAll";
  res = null;

  await fetch(url, {
    method: "get",
  })
    .then((response) => response.json())
    .then((data) => {
      res = data;
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  return res;
};

const createSheetAPI = async (newSheet) => {
  myHeader = new Headers();
  myHeaders.append("accept", "application/json");
  const formData = new FormData();

  console.log("Objeto -------------------------------------");
  Object.keys(newSheet).forEach((key) => {
    formData.append(key, newSheet[key]);
    console.log(`${key}: ${typeof newSheet[key]}`);
  });

  console.log("FormData -----------------------------------");

  for (var pair of formData.entries()) {
    console.log(`${pair[0]}: ${typeof pair[1]}`);
  }

  let url = "http://127.0.0.1:5000/sheet/create";
  const res = await fetch(url, {
    method: "post",
    headers: myHeader,
    body: formData,
  }).then((response) => {
    if (response.status == 200) return response.json();
    else throw Error(response.json().message);
  });

  return res;
};

const deleteSheetAPI = async (id) => {
  let url = "http://127.0.0.1:5000/sheet/delete?id=" + id;

  await fetch(url, {
    method: "delete",
  }).then(async (response) => {
    const res = await response.json();

    if (response.status == 404) {
      throw Error(res.message);
    }

    return true;
  });
};

const getAllCardsAPI = async () => {
  let url = "http://127.0.0.1:5000/card/getAll";
  res = null;

  await fetch(url, {
    method: "get",
  })
    .then((response) => response.json())
    .then((data) => {
      res = data;
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  return res;
};

const createCardAPI = async (newCard) => {
  const formData = new FormData();

  Object.keys(newCard).forEach((key) => formData.append(key, newCard[key]));

  let url = "http://127.0.0.1:5000//card/create";
  const res = await fetch(url, {
    method: "post",
    body: formData,
  }).then((response) => {
    if (response.status == 200) return response.json();
    else throw Error(response.json().message);
  });

  return res;

  // return new Promise((resolve, reject) => {
  //   setTimeout(() => {
  //     const sheet = sheetObject[newCard.sheetId];

  //     const card = {
  //       id: sheet.id + "-" + newCard.index,
  //       index: newCard.index,
  //       sheetId: sheet.id,
  //       maxLife: sheet.life,
  //       currLife: sheet.life,
  //       level: sheet.level,
  //       ac: sheet.ac,
  //       info: sheet.info,
  //       name: sheet.name,
  //     };
  //     resolve(card);
  //   }, 50);
  // });
};

const deleteCardAPI = async (id) => {
  let url = "http://127.0.0.1:5000/card/delete?id=" + id;

  await fetch(url, {
    method: "delete",
  }).then(async (response) => {
    const res = await response.json();

    if (response.status == 404) {
      throw Error(res.message);
    }

    return true;
  });
};
// /*
//   --------------------------------------------------------------------------------------
//   Carregar items
//   --------------------------------------------------------------------------------------
// */

window.addEventListener("load", async () => {
  const sheets = (await getAllSheetAPI()) ?? {};
  Object.values(sheets).map((sheet) => insertSheet(sheet));

  const cards = (await getAllCardsAPI()) ?? {};
  Object.values(cards)
    .sort((a, b) => a.index - b.index)
    .map((card) => insertCard(card));
});

// /*
//   --------------------------------------------------------------------------------------
//   Função para abrir ou fechar modal
//   --------------------------------------------------------------------------------------
// */

const toggleModal = (open) => {
  if (open) modal.classList.add("open");
  else {
    resetForm();
    modal.classList.remove("open");
  }
};

// /*
//   --------------------------------------------------------------------------------------
//   Funções da lista com fichas
//   --------------------------------------------------------------------------------------
// */

const createSheet = async () => {
  const sheetForm = document.getElementById("create-sheet");

  const baseObj = {
    icon: sheetForm.querySelector("#sheet-select-image").value,
    name: sheetForm.querySelector("#sheet-name").value,
    level: sheetForm.querySelector("#sheet-level").value,
    life: sheetForm.querySelector("#sheet-life").value,
    ac: sheetForm.querySelector("#sheet-ac").value,
    info: sheetForm.querySelector("#sheet-info").value,
  };

  const formatedName = baseObj.name.replaceAll(/\s/g, "").toLowerCase();
  if (baseObj.name === "") {
    return alert("Escreva um nome válido");
  } else if (
    Object.values(sheetObject).some(
      (n) => n.name.replaceAll(/\s/g, "").toLowerCase() === formatedName
    )
  ) {
    return alert("Esse nome já existe.");
  } else {
    const newSheet = await createSheetAPI(baseObj);

    if (newSheet?.id) {
      insertSheet(newSheet);
      toggleModal(false);
    } else {
      alert("Parece que ocorreu ume erro. Tente novamente mais tarde.");
    }
  }
};

const deleteSheet = async (dataId) => {
  if (
    !confirm(
      "Esta ação é irreversível. Todos os cartões vinculados a esta ficha serão excluídos. Deseja continuar?"
    )
  )
    return;

  try {
    await deleteSheetAPI(dataId);
    removeSheet(dataId);
  } catch (error) {
    return;
  }
};

const handleSheetClick = (dataId) => {
  if (sheetObject[dataId]) createCard(sheetObject[dataId]);
};

// /*
//   --------------------------------------------------------------------------------------
//   Funções dos cartões
//   --------------------------------------------------------------------------------------
// */

const createCard = async (newSheet) => {
  let index = 1;
  Object.values(cardObject).map((e) => {
    if (e.index >= index) index = e.index + 1;
  });

  const baseObj = {
    index,
    sheet_id: newSheet.id,
  };

  blockCardCreation(true);
  const newCard = await createCardAPI(baseObj);
  blockCardCreation(false);

  cardObject[newCard.id] = newCard;
  insertCard(newCard);
};

const changeCardLife = (id, action) => {
  const currCard = cardObject[id];
  const cardEl = document.querySelector(`[data-id="${id}"]`);
  const cardInput = cardEl.querySelector(".life-controls");
  const cardDisplay = cardEl.querySelector(".life-display");

  if (action === "lifeDisplay") {
    currCard.currLife = cardDisplay.value;
    return;
  }

  if (action === "reset") {
    if (!confirm("Deseja restaurar a vida desse cartão?")) return;

    currCard.currLife = currCard.maxLife;
  } else if (action === "plus") {
    currCard.currLife = Number(currCard.currLife) + Number(cardInput.value);
  } else if (action === "minus") {
    currCard.currLife = Number(currCard.currLife) - Number(cardInput.value);
  }

  if (currCard.currLife <= 0) cardEl.classList.add("dead");
  else if (cardEl.classList.contains("dead")) cardEl.classList.remove("dead");

  cardDisplay.value = currCard.currLife;
  cardInput.value = 1;

  processChange(currCard, "edit");
};

const saveCardInfo = (id) => {
  const currCard = cardObject[id];
  const cardInput = document.querySelector(`[data-id="${id}"] > .info`);

  currCard.info = cardInput.value;

  processChange(currCard, "edit");
};

const deleteCard = (dataId, verification = true) => {
  if (verification)
    if (!confirm("Esta ação é irreversível. Deseja excluir esse cartão?"))
      return;

  try {
    deleteCardAPI(dataId);
    removeCard(dataId);
  } catch (error) {
    return;
  }
};

const resetBoard = () => {
  if (
    !confirm(
      "Esta ação é irreversível. Todos os cartões serão excluídos. Deseja continuar?"
    )
  )
    return;

  cardObject = {};

  const items = document.querySelector("#card-list").querySelectorAll(".card");
  items.forEach((e) => e.remove());
};

// /*
//   --------------------------------------------------------------------------------------
//   Funções de manipulação de DOM
//   --------------------------------------------------------------------------------------
// */

const blockCardCreation = (isBlock) => {
  const items = document.querySelectorAll(".item");
  if (isBlock) items.forEach((e) => e.classList.add("block"));
  else items.forEach((e) => e.classList.remove("block"));
};

const insertSheet = (newSheet) => {
  sheetObject[newSheet.id] = newSheet;

  const div = document.createElement("div");
  const list = document.querySelector("#sheet-list");

  div.classList.add("item");
  div.setAttribute("data-id", `${newSheet.id}`);
  div.setAttribute("onclick", `handleSheetClick('${newSheet.id}')`);

  div.innerHTML = `
                <div class="picture">
                  <img src="${newSheet.icon}" class="full-background" />
                </div>
                <div class="content-bg">
                  <img src="img/TAG.png" class="full-background" />
                  <div class="content">
                    <p>${newSheet.name}</p>
                    <p>${newSheet.level}</p>
                    <button class="trash" id="delete-sheet">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="#000000"
                        viewBox="0 0 256 256"
                      >
                        <path
                          d="M216,48H180V36A28,28,0,0,0,152,8H104A28,28,0,0,0,76,36V48H40a12,12,0,0,0,0,24h4V208a20,20,0,0,0,20,20H192a20,20,0,0,0,20-20V72h4a12,12,0,0,0,0-24ZM100,36a4,4,0,0,1,4-4h48a4,4,0,0,1,4,4V48H100Zm88,168H68V72H188ZM116,104v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Zm48,0v64a12,12,0,0,1-24,0V104a12,12,0,0,1,24,0Z"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
            `;

  div.querySelector("#delete-sheet").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteSheet(newSheet.id);
  });

  list.append(div);
};

const insertCard = (newCard) => {
  cardObject[newCard.id] = newCard;

  const div = document.createElement("div");
  const list = document.querySelector("#card-list");

  div.classList.add("card");

  div.setAttribute("data-id", `${newCard.id}`);

  div.innerHTML = `
      <img class="full-background" src="img/CARD.png" />

      <div class="header">
        <p> ${newCard.index} - ${newCard.name} </p>
        <p>${newCard.level} </p>
        <button onclick="deleteCard('${newCard.id}')" class="close-card scale-on-hover">
          X
        </button>
      </div>

      <div class="middle">
        <div class="life">
          <button class="btn-full-life" onclick="changeCardLife('${newCard.id}','reset')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#fffafa"
              viewBox="0 0 256 256"
            >
              <path d="M88,108H40A12,12,0,0,1,28,96V48a12,12,0,0,1,24,0V67l7.8-7.8A99.42,99.42,0,0,1,130,29.94h.56a99.38,99.38,0,0,1,69.87,28.47,12,12,0,0,1-16.78,17.16,76,76,0,0,0-106.84.63L69,84H88a12,12,0,0,1,0,24Zm128,40H168a12,12,0,0,0,0,24h19l-7.8,7.8a75.55,75.55,0,0,1-53.32,22.26h-.43a75.49,75.49,0,0,1-53.09-21.63,12,12,0,0,0-16.78,17.16,99.38,99.38,0,0,0,69.87,28.47H126a99.42,99.42,0,0,0,70.16-29.29L204,189v19a12,12,0,0,0,24,0V160A12,12,0,0,0,216,148Z"></path>
            </svg>
          </button>

          <img class="bg-banner" src="img/BANNER.png" />
          <div class="btn-action damage" onclick="changeCardLife('${newCard.id}','minus')">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="#000000"
              viewBox="0 0 256 256"
            >
              <path d="M228,128a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128Z"></path>
            </svg>
          </div>

          <img class="bg-heart" src="img/HEART.png" />
          <input
            type="number"
            class="life-display"
            onblur="changeCardLife('${newCard.id}','lifeDisplay')"
            value="${newCard.currLife}"
          />
          <input type="number" class="life-controls" value="1" />

          <div
            class="btn-action cure"
            onclick="changeCardLife('${newCard.id}','plus')"
            id="cure"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="#000000"
              viewBox="0 0 256 256"
            >
              <path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z"></path>
            </svg>
          </div>
        </div>

        <div class="ac">
          <img src="img/SHILD.png" class="bg-shield full-background" />
          <p class="ac-display">${newCard.ac}</p>
        </div>
      </div>

      <textarea
        class="info"
        onblur="saveCardInfo('${newCard.id}')"
        placeholder="Informações..."
      >${newCard.info}</textarea>`;

  list.append(div);
  return null;
};

const removeSheet = (dataId) => {
  const item = document
    .querySelector("#sheet-list ")
    .querySelector(`[data-id="${dataId}"`);
  if (item) {
    item.remove();
    delete sheetObject[dataId];
  }

  let cardList = [];

  Object.values(cardObject).forEach((card) => {
    console.log(card);
    if (card.sheet_id == dataId) cardList.push(card.id);
  });

  cardList.forEach((cardId) => removeCard(cardId));
};

const removeCard = (dataId) => {
  const item = document
    .querySelector("#card-list")
    .querySelector(`[data-id="${dataId}"`);

  if (item) {
    item.remove();
    delete cardObject[dataId];
  }
};

const selectImageForm = () => {
  const icon = document.getElementById("sheet-select-image").value;
  const img = document.getElementById("sheet-image");

  img.setAttribute("src", `${icon}`);
};

const resetForm = () => {
  const sheetForm = document.getElementById("create-sheet");

  const areas = [
    sheetForm.querySelector("#sheet-select-image"),
    sheetForm.querySelector("#sheet-name"),
    sheetForm.querySelector("#sheet-level"),
    sheetForm.querySelector("#sheet-life"),
    sheetForm.querySelector("#sheet-ac"),
    sheetForm.querySelector("#sheet-info"),
  ];

  areas.forEach((e) => (e.value = e.getAttribute("data-value")));
  selectImageForm();
};

/*
  --------------------------------------------------------------------------------------
   Outros
  --------------------------------------------------------------------------------------
*/
const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
};

function saveData(param, action) {
  console.log("Salvando os dados:", param, action);
}

const processChange = debounce(saveData, 500);
