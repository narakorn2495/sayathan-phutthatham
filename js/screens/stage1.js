
// js/screens/stage1.js
(function () {
  "use strict";

  var App = window.App;

  App.screens = App.screens || {};

  App.screens.stage1 = {
    enter: function (options) {
      options = options || {};

      App.ui.showScreen("stage1");

      var container = document.getElementById("stage1-content");
      if (!container) return;

      container.textContent = "";

      var gameData = window.GAME_DATA.stage1;
      var cards = gameData.cards;
      var config = App.config || {};
      var durationSec = Number(config.STAGE_TIME_SEC) || 120;

      var timer = null;
      var timerBar = null;
      var timeoutId = null;

      var listeners = [];
      var slots = [];
      var available = [];
      var stagingId = null;
      var stagingArea = null;

      var started = false;
      var locked = false;
      var completed = false;

      // จัดการ Event เพื่อให้ล้างได้เมื่อจบด่าน
      function addEvent(element, eventName, handler) {
        element.addEventListener(eventName, handler);

        listeners.push({
          element: element,
          eventName: eventName,
          handler: handler
        });
      }

      function cleanup() {
        if (timer) {
          timer.stop();
          timer = null;
        }

        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        listeners.forEach(function (item) {
          item.element.removeEventListener(
            item.eventName,
            item.handler
          );
        });

        listeners = [];

        if (timerBar) {
          timerBar.remove();
          timerBar = null;
        }
      }

      // ส่งผลลัพธ์เพียงครั้งเดียว
      function finish(timedOut) {
        if (completed) return;

        completed = true;
        locked = true;

        var timeUsed = timer
          ? timer.elapsedSec()
          : 0;

        cleanup();

        if (typeof options.onDone === "function") {
          options.onDone({
            answers: {
              order: slots.slice()
            },
            timeUsedSec: timedOut ? durationSec : timeUsed,
            timedOut: Boolean(timedOut)
          });
        }
      }

      // สุ่มการ์ดใหม่ และป้องกันลำดับตรงกับเฉลย
      function shuffleCards() {
        var ids = Object.keys(cards);
        var answerOrder = gameData.answerOrder;

        available = App.ui.shuffle(ids);

        var attempts = 0;

        while (
          available.join("|") === answerOrder.join("|") &&
          attempts < 20
        ) {
          available = App.ui.shuffle(ids);
          attempts++;
        }

        if (available.join("|") === answerOrder.join("|")) {
          available.push(available.shift());
        }

        slots = new Array(ids.length).fill(null);
      }

      // หน้าคำอธิบาย
      function showIntroduction() {
        var heading = App.ui.el("h2", {
          className: "stage1-heading",
          textContent: "ด่านที่ 1"
        });

        var title = App.ui.el("h3", {
          className: "stage1-title",
          textContent: gameData.title
        });

        var instruction = App.ui.el("p", {
          className: "stage1-instruction",
          textContent: gameData.instruction
        });

        var info = App.ui.el("div", {
          className: "stage1-info",
          textContent: "🃏 มีการ์ดทั้งหมด 10 ใบ"
        });

        var timeInfo = App.ui.el("div", {
          className: "stage1-info",
          textContent: "⏱ เวลาทำกิจกรรม 2 นาที"
        });

        var button = App.ui.el("button", {
          className: "btn stage1-start-btn",
          type: "button",
          textContent: "เริ่มด่าน"
        });

        addEvent(button, "click", function () {
          if (started || completed) return;

          started = true;
          showGame();
        });

        container.appendChild(heading);
        container.appendChild(title);
        container.appendChild(instruction);
        container.appendChild(info);
        container.appendChild(timeInfo);
        container.appendChild(button);
      }

      // ตรวจสอบว่าจัดครบทุกช่องหรือยัง
      function isComplete() {
        return slots.every(function (id) {
          return id !== null;
        });
      }

      // นับจำนวนการ์ดที่เลือกแล้ว
      function selectedCount() {
        return slots.filter(function (id) {
          return id !== null;
        }).length;
      }

      // นำการ์ดจากมือผู้เล่นเข้าพื้นที่พัก
      function stageCard(id) {
        if (locked || completed) return;
      
        var index = available.indexOf(id);
        if (index === -1) return;
      
        // คืนการ์ดเดิมในพื้นที่พักกลับไปที่มือ
        if (stagingId !== null) {
          available.push(stagingId);
        }
      
        available.splice(index, 1);
        stagingId = id;
      
        renderBoard();
      }
      
      // ยกเลิกการ์ดในพื้นที่พัก
      function cancelStaging() {
        if (locked || completed || stagingId === null) return;
      
        available.push(stagingId);
        stagingId = null;
      
        renderBoard();
      }

// วางการ์ดลงในช่องเส้นเวลา
function placeCard(index) {
  if (locked || completed) return;

  if (index < 0 || index >= slots.length) return;

  // หากยังไม่มีการ์ดในพื้นที่พัก
  // ให้แตะการ์ดที่วางอยู่เพื่อหยิบกลับมาพัก
  if (stagingId === null) {
    if (slots[index] === null) return;

    stagingId = slots[index];
    slots[index] = null;

    renderBoard();
    return;
  }

  // สลับการ์ดกับช่องที่เลือก
  var oldId = slots[index];

  slots[index] = stagingId;
  stagingId = oldId;

  renderBoard();
}

      // แสดงจำนวนการ์ดที่เลือก
      function updateProgress() {
        var count = selectedCount();

        progressText.textContent =
          "เลือกแล้ว " + count + " / " + slots.length + " ใบ";

        submitButton.disabled = !isComplete() || locked;
      }

      // เลือกการ์ดใส่ช่องว่างช่องแรก
      function selectCard(id) {
        if (locked || completed) return;

        var availableIndex = available.indexOf(id);

        if (availableIndex === -1) return;

        var emptyIndex = slots.indexOf(null);

        if (emptyIndex === -1) return;

        slots[emptyIndex] = id;

        available.splice(availableIndex, 1);

        renderBoard();
      }

      // ยกเลิกการ์ดจากช่องที่เลือก
      function removeCard(index) {
        if (locked || completed) return;

        if (
          index < 0 ||
          index >= slots.length ||
          slots[index] === null
        ) {
          return;
        }

        var removedId = slots[index];

        slots[index] = null;

        // นำการ์ดกลับไปท้ายรายการ
        available.push(removedId);

        renderBoard();
      }

      // สร้างช่องคำตอบและรายการการ์ด
      function renderBoard() {
        slotList.textContent = "";
        cardList.textContent = "";

        // ส่วนช่องคำตอบ 10 ช่อง
        slots.forEach(function (id, index) {
          var slot = App.ui.el("div", {
            className: "stage1-slot" +
              (id !== null ? " stage1-slot--filled" : ""),
            "data-action": "slot",
            "data-index": String(index)
          });
        
          var number = App.ui.el("span", {
            className: "stage1-slot__number",
            textContent: String(index + 1)
          });

          slot.appendChild(number);

          if (id !== null) {
            var card = App.ui.el("div", {
              className: "stage1-slot__card",
              textContent: cards[id]
            });

            var removeButton = App.ui.el("button", {
              className: "stage1-slot__remove",
              type: "button",
              textContent: "×",
              "aria-label": "ยกเลิกการ์ดลำดับที่ " + (index + 1),
              "data-action": "remove",
              "data-index": String(index)
            });

            slot.appendChild(card);
            slot.appendChild(removeButton);
          } else {
            var placeholder = App.ui.el("span", {
              className: "stage1-slot__placeholder",
              textContent: "แตะเพื่อวาง"
            });

            slot.appendChild(placeholder);
          }

          slotList.appendChild(slot);
        });

        // แสดงการ์ดในพื้นที่พัก
        if (stagingArea) {
          stagingArea.textContent = "";
        
          if (stagingId !== null) {
            var stagedCard = App.ui.el("div", {
              className: "stage1-staged-card",
              textContent: cards[stagingId]
            });
        
            var cancelButton = App.ui.el("button", {
              className: "stage1-staging-cancel",
              type: "button",
              textContent: "×",
              "aria-label": "ยกเลิกการ์ดที่พัก"
            });
        
            addEvent(cancelButton, "click", cancelStaging);
        
            stagingArea.appendChild(stagedCard);
            stagingArea.appendChild(cancelButton);
          } else {
            stagingArea.appendChild(
              App.ui.el("span", {
                className: "stage1-staging-empty",
                textContent: "แตะการ์ดด้านล่างเพื่อเลือก"
              })
            );
          }
        }

        // ส่วนการ์ดที่ยังไม่ได้เลือก
        available.forEach(function (id) {
          var cardButton = App.ui.el("button", {
            className: "stage1-choice-card",
            type: "button",
            textContent: cards[id],
            "data-action": "select",
            "data-id": id,
            disabled: locked
          });

          cardList.appendChild(cardButton);
        });

        updateProgress();
      }

      // สร้างหน้ากิจกรรม
      function showGame() {
        container.textContent = "";

        var heading = App.ui.el("h2", {
          className: "stage1-heading",
          textContent: "ด่านที่ 1"
        });

        var instruction = App.ui.el("p", {
          className: "stage1-instruction",
          textContent: "แตะการ์ดเพื่อเรียงเหตุการณ์จากเก่าสุดไปใหม่สุด"
        });

        var boardTitle = App.ui.el("h3", {
          className: "stage1-section-title",
          textContent: "ลำดับเหตุการณ์ของคุณ"
        });

        var progressTextElement = App.ui.el("p", {
          className: "stage1-progress",
          textContent: "เลือกแล้ว 0 / 10 ใบ"
        });

        progressText = progressTextElement;

        var slotListElement = App.ui.el("div", {
          className: "stage1-slot-list"
        });

        slotList = slotListElement;

        var choiceTitle = App.ui.el("h3", {
          className: "stage1-section-title",
          textContent: "การ์ดเหตุการณ์"
        });

        var choiceInstruction = App.ui.el("p", {
          className: "stage1-choice-instruction",
          textContent: "แตะการ์ดด้านล่างเพื่อเติมลงในช่องว่าง หากเลือกผิดให้กด ×"
        });

        var cardListElement = App.ui.el("div", {
          className: "stage1-choice-list"
        });

        cardList = cardListElement;

        var stagingElement = App.ui.el("div", {
          className: "stage1-staging"
        });
        
        stagingArea = stagingElement;

        var submitBar = App.ui.el("div", {
          className: "stage1-submit-bar"
        });

        var submitButtonElement = App.ui.el("button", {
          className: "btn stage1-submit-btn",
          type: "button",
          textContent: "ส่งคำตอบ",
          disabled: true
        });

        submitButton = submitButtonElement;

        // แตะการ์ดที่ยังไม่ได้เลือก
        addEvent(cardList, "click", function (event) {
          if (locked || completed) return;
        
          var target = event.target.closest(
            '[data-action="select"]'
          );
        
          if (!target || !cardList.contains(target)) return;
        
          stageCard(target.getAttribute("data-id"));
        });
        
        // กด X เพื่อนำการ์ดออก
        addEvent(slotList, "click", function (event) {
          if (locked || completed) return;
        
          var target = event.target.closest("button[data-action='remove']");
        
          if (target && slotList.contains(target)) {
            var index = Number(target.getAttribute("data-index"));
            removeCard(index);
            return;
          }
        
          var slot = event.target.closest(
            '[data-action="slot"]'
          );
        
          if (!slot || !slotList.contains(slot)) return;
        
          var slotIndex = Number(slot.getAttribute("data-index"));
        
          placeCard(slotIndex);
        });

        // ส่งคำตอบ
        addEvent(submitButton, "click", function () {
          if (locked || completed || !isComplete()) return;

          finish(false);
        });

        submitBar.appendChild(submitButton);

        container.appendChild(heading);
        container.appendChild(instruction);

        var board = App.ui.el("section", {
          className: "stage1-board"
        });

        board.appendChild(boardTitle);
        board.appendChild(progressTextElement);
        board.appendChild(slotListElement);

        var choices = App.ui.el("section", {
          className: "stage1-choices"
        });

        choices.appendChild(choiceTitle);
        choices.appendChild(choiceInstruction);
        choices.appendChild(cardListElement);

        container.appendChild(board);
        container.appendChild(stagingElement);
        container.appendChild(choices);
        container.appendChild(submitBar);

        shuffleCards();
        renderBoard();

        timerBar = App.timer.renderBar(container, 1);

        timer = App.timer.create({
          durationSec: durationSec,

          onTick: function (remainingSec) {
            if (timerBar) {
              timerBar.update(remainingSec);
            }
          },

          onExpire: function () {
            if (completed || locked) return;

            locked = true;

            // ปิดการใช้งานทั้งหมดทันที
            submitButton.disabled = true;

            var choiceButtons = container.querySelectorAll("button");

            choiceButtons.forEach(function (button) {
              button.disabled = true;
            });

            if (timerBar) {
              timerBar.update(0);
            }

            var message = App.ui.el("div", {
              className: "stage1-timeout",
              role: "alert",
              textContent: "⏰ หมดเวลา!"
            });

            container.appendChild(message);

            timeoutId = setTimeout(function () {
              timeoutId = null;
              finish(true);
            }, 1500);
          }
        });

        timer.start();
      }

      // ตัวแปรอ้างอิงส่วนแสดงผล
      var progressText = null;
      var slotList = null;
      var cardList = null;
      var submitButton = null;

      showIntroduction();
    }
  };
})();
