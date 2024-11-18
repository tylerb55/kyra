export const MultiselectCheckbox = {
    name: 'MultiselectCheckbox',
    type: 'response',
    match: ({ trace }) =>
      trace.type === 'ext_multiselect_checkbox' || trace.payload.name === 'ext_multiselect_checkbox',
    render: ({ trace, element }) => {
      const CheckboxExtContainer = document.createElement('div');
      const defaultJson = {"Parameters":["Size","Height","Weight"]};
      const Params = (trace && trace.payload && trace.payload.Parameters) || defaultJson; 
      console.log(Params);
      CheckboxExtContainer.innerHTML = `
            <style>
              .wrapper {
                display: flex;
                flex-direction: column; /* Display checkboxes vertically */
                gap: 10px;
                flex-wrap: wrap;
                justify-content: center;
                max-width: 300px; /* Set a max-width to keep the container manageable */
                margin: 0 auto; /* Center the container */
              }
              .row {
                display: flex;
                flex-direction: column; /* Display checkboxes vertically */
                gap: 10px;
                margin-bottom: 10px;
              }
              .checkbox-label {
                display: flex;
                align-items: center;
                gap: 5px;
              }
              .submit {
                background-color: white;
                color: #03045e;
                padding: 10px;
                border: none;
                border-radius: 8px;
                box-shadow: rgba(0, 0, 0, 0.12) 0px 5px 8px -8px, rgba(0, 0, 0, 0.12) 0px 2px 4px -3px, rgba(0, 0, 0, 0.03) 0px 0px 0px 1px, rgba(0, 0, 0, 0.01) 0px 1px 3px 1px;
                width: 100%;
                cursor: pointer;
              }
              .submit:disabled {
                background-color: #ccc;
                color: #666;
                cursor: not-allowed;
              }
            </style>
            <div class="wrapper" id="checkboxContainer">
              ${generateCheckboxes(Params)}
            </div>
            <button class="submit" disabled>Confirm Parameter Selection</button>`;
  
      function generateCheckboxes(params) {
        let checkboxHTML = '<div class="row">';
        params.forEach(param => {
          checkboxHTML += `
            <label class="checkbox-label">
              <input type="checkbox" id="${param}" name="${param.name}" value="${param}">
              ${param}
            </label>`;
        });
        checkboxHTML += `
          <label class="checkbox-label">
            <input type="checkbox" id="selectAll" name="selectAll" value="selectAll">
            Select All
          </label>`;
        checkboxHTML += '</div>';
        return checkboxHTML;
      }
  
      let selectedParameters = [];
      const submitButton = CheckboxExtContainer.querySelector('.submit');
      let isSubmitted = false;
  
      function updateSubmitButton() {
        submitButton.disabled = selectedParameters.length < 1 || isSubmitted;
      }
  
      CheckboxExtContainer.addEventListener('click', function (event) {
        if (!isSubmitted && event.target.type === 'checkbox') {
          if (event.target.id === 'selectAll') {
            const checkboxes = CheckboxExtContainer.querySelectorAll('input[type=checkbox]:not(#selectAll)');
            if (event.target.checked) {
              selectedParameters = [];
              checkboxes.forEach((checkbox) => {
                checkbox.checked = true;
                selectedParameters.push(checkbox.value);
              });
            } else {
              checkboxes.forEach((checkbox) => {
                checkbox.checked = false;
              });
              selectedParameters = [];
            }
          } else {
            if (event.target.checked) {
              selectedParameters.push(event.target.value);
            } else {
              selectedParameters = selectedParameters.filter((param) => param !== event.target.value);
            }
            // Uncheck "Select All" if not all items are selected
            const selectAllCheckbox = CheckboxExtContainer.querySelector('#selectAll');
            if (selectAllCheckbox) {
              selectAllCheckbox.checked = selectedParameters.length === Params.length;
            }
          }
          updateSubmitButton();
        }
      });
  
      submitButton.addEventListener('click', function () {
        if (!isSubmitted) {
          isSubmitted = true;
          updateSubmitButton();
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: { "selected_parameters":selectedParameters },
          });
        }
      });
  
      element.appendChild(CheckboxExtContainer);
    },
  };
  
  
  export const MultiselectCarousel = {
    name:'MultiselectCarousel',
    type:'response',
    match: ({trace}) =>
      trace.type === 'ext_multiselect_carousel' || trace.payload.name === 'ext_multiselect_carousel',
    render: ({trace, element}) => {
      const MultiselectCarouselContainer = document.createElement('div');
      const defaultJson = [{"part":"placeholder","Manufacturer":"placeholder","Parts_Number_Supplier":"1234","Price":"$20","Categories":"placeholder","Image":"https://themonroefirm.com/wp-content/uploads/2015/01/300x300.jpg"},{"part":"placeholder","Manufacturer":"placeholder","Parts_Number_Supplier":"1234","Price":"$20","Categories":"placeholder","Image":"https://themonroefirm.com/wp-content/uploads/2015/01/300x300.jpg"},{"part":"placeholder","Manufacturer":"placeholder","Parts_Number_Supplier":"1234","Price":"$20","Categories":"placeholder","Image":"https://themonroefirm.com/wp-content/uploads/2015/01/300x300.jpg"}];
      const Parts = (trace && trace.payload && trace.payload.parts_list) || defaultJson; 
      console.log(Parts);
      MultiselectCarouselContainer.innerHTML = `
      <style>
          * { padding: 0; margin: 0; box-sizing: border-box; }
          .c-gMpNkY.c-PJLV-jueArD-from-system {
          background-color: transparent;
          } 
          .part-selection {
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            gap: 10px;
            margin-bottom: 0px;
            padding-bottom: 10px;
            transition: transform 0.5s ease;
          }
          .row {
            display: flex;
            flex-direction: row;
            gap: 10px;
          }
          .card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            overflow: hidden;
            border-radius: 8px;
            width: 248px;
            background-color: #f4f4f4;
            min-width: 200px;
          }
          .card img {
            width: 100%;
            border-radius: 8px;
            height: 100%;
            object-fit: contain;
          }
          .content {
            display: flex;
            flex-direction: column;
            gap: 5px;
            width: 100%;
            padding: 12px;
          }
          .details span, .price {
            font-size: 15px;
            font-weight: 600;
            color: black;
          }
          .details p {
            font-size: 13px;
            color: #737376;
          }
          .select-btn {
            display: block;
            width: 100%;
            margin: 10px auto;
            padding: 12px;
            background-color: white;
            color: #03045e;
            box-shadow: rgba(0, 0, 0, 0.12) 0px 5px 8px -8px, rgba(0, 0, 0, 0.12) 0px 2px 4px -3px, rgba(0, 0, 0, 0.03) 0px 0px 0px 1px, rgba(0, 0, 0, 0.01) 0px 1px 3px 1px;
            font-size: 16px;
            line-weight: 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            transition: background-color 0.3s ease;
          }
          .select-btn.selected {
            background-color: #6B6B6B;
          }
          .submit {
            background-color: #2e6ee1;
            color: white;
            cursor: pointer;
          }
          .submit:disabled {
            background-color: #ccc;
            color: #666;
            cursor: not-allowed;
          }
          .scroll-button {
            position: fixed;
            top: 30%;
            transform: translateY(-10%);
            width: 40px;
            height: 40px;
            background-color: white;
            color: #000c;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 1000;
          }
          .scroll-button .svg {
            width: 8px;
            height: 8px;
            transition: 0.2s ease;
            }
          .scroll-button.left {
            left: -30px;
          }
          .scroll-button.right {
            left: 250px;
          }
          .scroll-button:hover {
            color: black;
          }
          .button-container {
            display: flex;
            flex-direction: column;
            position: relative;
          }
          .button-container button {
            position: relative;
            left: -15px;
            width: 262px;
            margin: 3px;
            padding: 8px;
            background-color: white;
            color: #03045e;
            box-shadow: rgba(0, 0, 0, 0.12) 0px 5px 8px -8px, rgba(0, 0, 0, 0.12) 0px 2px 4px -3px, rgba(0, 0, 0, 0.03) 0px 0px 0px 1px, rgba(0, 0, 0, 0.01) 0px 1px 3px 1px;
            font-size: 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            transition: background-color 0.3s ease;
          }
      </style>
      <div class="part-selection-container">
        <div class="scroll-button left" id="scrollLeft">
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g fill="none" fill-rule="evenodd"><path fill="currentColor" d="M14.25 7.281a.75.75 0 0 1 0 1.5H3.38l2.474 2.77a.75.75 0 1 1-1.152.96l-3.5-4a.75.75 0 0 1 0-.96l3.5-4a.75.75 0 0 1 1.152.96L3.38 7.282H14.25z"></path></g></svg>
        </div>
        <div class="scroll-button right" id="scrollRight" style="display: flex;">
          <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g fill="none" fill-rule="evenodd"><path fill="currentColor" stroke-width="0.25" d="M1.75 8.719a.75.75 0 0 1 0-1.5h10.87L10.146 4.45a.75.75 0 1 1 1.152-.96l3.5 4a.75.75 0 0 1 0 .96l-3.5 4a.75.75 0 0 1-1.152-.96l2.474-2.77H1.75z"></path></g></svg>
        </div>
        <div class="part-selection">
          ${generateCards(Parts)}
        </div>
      </div>
      <div class="button-container">
        <button class="submit" disabled>Confirm Part Selection</button>
        <button class="skip">Skip Selection</button>
        <button class="filter">Filter Selection</button>
        <button class="next">Next Work Item</button>
      </div>
      `;
  
      function generateCards(parts) {
        const cards = parts.length;
        let cardsHTML = '';
        cardsHTML += '<div class="row">';
        for (let j = 0; j < cards; j++) {
          console.log(parts[j].Image)
          let part = JSON.stringify(parts[j]);
          cardsHTML += `<div class="card">
            <img src="${parts[j].Image}" alt="">
            <div class="content">
              <div class="row">
                <div class="details">
                  <span>${parts[j].Categories}</span>
                  <p>${parts[j].Manufacturer}</p>
                </div>
                <div class="price">£${parts[j].Price}</div>
              </div>
              <div class="buttons">
                <button class="select-btn" data-part="${part}">Select</button>
              </div>
            </div>
          </div>`;
        }
        cardsHTML += '</div>';
        return cardsHTML;
      }
  
      let selectedParts = [];
      const submitButton = MultiselectCarouselContainer.querySelector('.submit');
      const skipButton = MultiselectCarouselContainer.querySelector('.skip');
      const filterButton = MultiselectCarouselContainer.querySelector('.filter');
      const nextButton = MultiselectCarouselContainer.querySelector('.next');
      let isSubmitted = false;
  
      function updateSubmitButton() {
        submitButton.disabled =
          selectedParts.length < 1 || isSubmitted;
      }
  
      MultiselectCarouselContainer.addEventListener('click', function (event) {
        if (
          !isSubmitted &&
          event.target.classList.contains('select-btn')
        ) {
          if (event.target.classList.contains('selected')) {
            event.target.classList.remove('selected');
            selectedParts = selectedParts.filter(
              (part) => part !== event.target.dataset.part
            );
            event.target.textContent = 'Select';
          } else if (selectedParts.length < Parts.length) {
            event.target.classList.add('selected');
            selectedParts.push(event.target.dataset.part);
            event.target.textContent = 'Deselect';
          }
          updateSubmitButton();
        }
      });
  
      submitButton.addEventListener('click', function () {
        if (!isSubmitted) {
          isSubmitted = true;
          updateSubmitButton();
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: { "selected_parts":selectedParts },
          });
        }
      });
  
      skipButton.addEventListener('click', function () {
        window.voiceflow.chat.interact({
          type: 'skip',
        });
      });
  
      filterButton.addEventListener('click', function () {
        window.voiceflow.chat.interact({
          type: 'filter',
        });
      });
  
      nextButton.addEventListener('click', function () {
        window.voiceflow.chat.interact({
          type: 'no selection',
        });
      });
  
      const scrollLeftButton = MultiselectCarouselContainer.querySelector('#scrollLeft');
      const scrollRightButton = MultiselectCarouselContainer.querySelector('#scrollRight');
      const partSelection = MultiselectCarouselContainer.querySelector('.part-selection');
  
      let currentTranslate = 0;
      let currentCard = 1;
  
      function updateScrollButtons() {
        if (currentTranslate >= 0) {
          scrollLeftButton.style.display = 'none';
        } else {
          scrollLeftButton.style.display = 'flex';
        }
        if (currentCard === Parts.length) {
          scrollRightButton.style.display = 'none';
        } else {
          scrollRightButton.style.display = 'flex';
        }
      }
  
      scrollLeftButton.addEventListener('click', () => {
        currentTranslate += 265;
        currentCard -= 1;
        partSelection.style.transform = `translateX(${currentTranslate}px)`;
        updateScrollButtons();
      });
  
      scrollRightButton.addEventListener('click', () => {
        currentTranslate -= 265;
        currentCard += 1;
        partSelection.style.transform = `translateX(${currentTranslate}px)`;
        updateScrollButtons();
      });
  
      updateScrollButtons();
  
      element.appendChild(MultiselectCarouselContainer);
    },
  }
  