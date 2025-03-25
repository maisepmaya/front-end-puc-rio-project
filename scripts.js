const modal = document.getElementById("modal");
let sheetObject = {};
let cardObject = {};

let blockCreate = false;

// /*
//   --------------------------------------------------------------------------------------
//   Carregar items
//   --------------------------------------------------------------------------------------
// */

window.addEventListener("load", async () => {
  try {
    const sheets = (await getAllSheetAPI()) ?? {};
    Object.values(sheets).map((sheet) => insertSheet(sheet));

    const cards = (await getAllCardsAPI()) ?? {};
    Object.values(cards)
      .sort((a, b) => a.index - b.index)
      .map((card) => insertCard(card));
  } catch (error) {
    console.log(error);
    alert("Ocorreu algum erro no carregamento. Sua página será reiniciada");
  }

  document.getElementById("load-page").remove();
});

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
  const formData = new FormData();

  Object.keys(newSheet).forEach((key) => {
    formData.append(key, newSheet[key]);
  });

  let url = "http://127.0.0.1:5000/sheet/create";
  const res = await fetch(url, {
    method: "post",
    body: formData,
  }).then((response) => {
    console.log(response);
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

  let url = "http://127.0.0.1:5000/card/create";
  const res = await fetch(url, {
    method: "post",
    body: formData,
  }).then((response) => {
    if (response.status == 200) return response.json();
    else throw Error(response.json().message);
  });

  return res;
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

const updateCardAPI = async (card) => {
  const formData = new FormData();

  formData.append("id", card.id);
  formData.append("index", card.index);
  formData.append("currLife", card.currLife);
  formData.append("info", card.info);

  let url = "http://127.0.0.1:5000/card/update";
  const res = await fetch(url, {
    method: "put",
    body: formData,
  }).then((response) => {
    if (response.status == 200) return response.json();
    else throw Error(response.json().message);
  });

  return res;
};

const deleteAllCardsAPI = async () => {
  let url = "http://127.0.0.1:5000/card/deleteAll";

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
let count = 0;
const createCard = async (newSheet) => {
  let index = 1;
  Object.values(cardObject).map((e) => {
    if (e.index >= index) index = e.index + 1;
  });

  blockCardCreation(true);

  try {
    const newCard = await createCardAPI({
      index,
      sheet_id: newSheet.id,
    });
    cardObject[newCard.id] = newCard;
    insertCard(newCard);
    count += 1;
  } catch (error) {
    alert(
      "Parece que ocorreu um erro na criação desse cartão! Tente novamente."
    );
  }

  setTimeout(() => {
    blockCardCreation(false);
    count = 0;
  }, 1000);
};

const changeCardLife = (id, action) => {
  const currCard = cardObject[id];
  const cardEl = document.querySelector(`[data-id="${id}"]`);
  const cardInput = cardEl.querySelector(".life-controls");
  const cardDisplay = cardEl.querySelector(".life-display");

  if (action === "lifeDisplay") {
    currCard.currLife = cardDisplay.value;
  } else if (action === "reset") {
    if (!confirm("Deseja restaurar a vida desse cartão?")) return;
    currCard.currLife = currCard.life;
  } else if (action === "plus") {
    currCard.currLife = Number(currCard.currLife) + Number(cardInput.value);
  } else if (action === "minus") {
    currCard.currLife = Number(currCard.currLife) - Number(cardInput.value);
  }

  if (currCard.currLife <= 0 && !cardEl.classList.contains("dead"))
    cardEl.classList.add("dead");
  else if (cardEl.classList.contains("dead")) cardEl.classList.remove("dead");

  if (currCard.currLife >= currCard.life && !cardEl.classList.contains("full"))
    cardEl.classList.add("full");
  else if (cardEl.classList.contains("full")) cardEl.classList.remove("full");

  cardDisplay.value = currCard.currLife;
  cardInput.value = 1;

  processChange(currCard, "edit");
};

const saveCardInfo = (id) => {
  const currCard = cardObject[id];
  const cardInput = document.querySelector(`[data-id="${id}"] > div > .info`);

  console.log(cardInput);
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

const resetCards = async () => {
  if (
    !confirm(
      "Esta ação é irreversível. Todos os cartões serão excluídos. Deseja continuar?"
    )
  )
    return;

  await deleteAllCardsAPI();
  removeAllCards();
};

const removeAllCards = () => {
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
                <div class="loading">
                  <div class="spinner"></div>
                </div>
                <div class="picture">
                  <img src="${newSheet.icon}" class="full-background" />
                </div> 
                <p>${newSheet.name}</p>
                  <div class="content">
                    <p class="level" >${newSheet.level}</p>
                    <button class="trash scale-on-hover" id="delete-sheet">
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

  if (newCard.currLife <= 0) div.classList.add("dead");
  if (newCard.currLife >= newCard.life) div.classList.add("full");

  div.setAttribute("data-id", `${newCard.id}`);

  div.innerHTML = `
      <div class="header">
        <p>${newCard.name}</p>
        <p class="level">${newCard.level}</p>
      </div>

      <button
        onclick="deleteCard('${newCard.id}')"
        class="close-btn scale-on-hover"
      ></button>

      <div class="middle">
        <div class="life">
          <div class="life-controls-container">
            <button
              class="cure scale-on-hover"
              onclick="changeCardLife('${newCard.id}','plus')"
            ></button>

            <input type="number" class="life-controls" value="1" />

            <button
              class="damage scale-on-hover"
              onclick="changeCardLife('${newCard.id}','minus')"
            ></button>
          </div>

          <input
            type="number"
            class="life-display"
            onblur="changeCardLife('${newCard.id}','lifeDisplay')"
            value="${newCard.currLife}"
          />

          <button
            class="btn-full-life scale-on-hover tooltip"
            onclick="changeCardLife('${newCard.id}','reset')"
          ></button>
        </div>

        <div class="index">${newCard.index}</div>
        <div class="ac">
          <p class="ac-display">${newCard.ac}</p>
        </div>
      </div>

      <div class="info-container">
        <p>Informações:</p>
        <textarea
          class="info"
          spellcheck="false"
          onblur="saveCardInfo('${newCard.id}')"
          placeholder="Nada para mostrar..."
        >${newCard.info ?? ""}</textarea>
      </div>`;

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

function saveCard(card) {
  updateCardAPI(card);
}

const processChange = debounce(saveCard, 500);
