
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
      var answerOrder = gameData.answerOrder;

      var config = App.config || {};
      var durationSec = Number(config.STAGE_TIME_SEC) || 120;

      var timer = null;
      var timerBar = null;
      var highlightTimeout = null;

      var listeners = [];
      var order = [];
      var finished = false;
      var started = false;

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

        if (highlightTimeout !== null) {
          clearTimeout(highlightTimeout);
          highlightTimeout = null;
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
        if (finished) return;

        finished = true;

        var timeUsed = timer
          ? timer.elapsedSec()
          : 0;

        cleanup();

        if (typeof options.onDone === "function") {
          options.onDone({
            answers: {
              order: order.slice()
            },
            timeUsedSec: timeUsed,
            timedOut: Boolean(timedOut)
          });
        }
      }

      // สุ่มการ์ดใหม่
      function shuffleCards() {
        var ids = Object.keys(cards);

        order = App.ui.shuffle(ids);

        var attempts = 0;

        while (
          order.join("|") === answerOrder.join("|") &&
          attempts < 20
        ) {
          order = App.ui.shuffle(ids);
          attempts++;
        }

        // ป้องกันกรณีสุ่มได้ลำดับเดิมซ้ำทุกครั้ง
        if (order.join("|") === answerOrder.join("|")) {
          order.push(order.shift());
        }
      }

      // สร้างหน้าคำอธิบายก่อนเริ่มเกม
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
          if (started || finished) return;

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

      // แสดงรายการการ์ด
      function renderCards(highlightId) {
        var list = document.getElementById("stage1-card-list");

        if (!list) return;

        // ล้าง Event ของปุ่มชุดเดิมก่อนสร้างใหม่
        listeners = listeners.filter(function (item) {
          if (item.element.closest("#stage1-card-list")) {
            item.element.removeEventListener(
              item.eventName,
              item.handler
            );

            return false;
          }

          return true;
        });

        list.textContent = "";

        order.forEach(function (id, index) {
          var item = App.ui.el("div", {
            className: "stage1-card" +
              (id === highlightId
                ? " stage1-card--highlight"
                : "")
          });

          var number = App.ui.el("span", {
            className: "stage1-card__number",
            textContent: String(index + 1)
          });

          var text = App.ui.el("div", {
            className: "stage1-card__text",
            textContent: cards[id]
          });

          var controls = App.ui.el("div", {
            className: "stage1-card__controls"
          });

          var upButton = App.ui.el("button", {
            className: "stage1-move-btn",
            type: "button",
            textContent: "▲",
            disabled: index === 0,
            "aria-label": "เลื่อนขึ้น"
          });

          var downButton = App.ui.el("button", {
            className: "stage1-move-btn",
            type: "button",
            textContent: "▼",
            disabled: index === order.length - 1,
            "aria-label": "เลื่อนลง"
          });

          addEvent(upButton, "click", function () {
            moveCard(index, -1);
          });

          addEvent(downButton, "click", function () {
            moveCard(index, 1);
          });

          controls.appendChild(upButton);
          controls.appendChild(downButton);

          item.appendChild(number);
          item.appendChild(text);
          item.appendChild(controls);

          list.appendChild(item);
        });
      }

      // เลื่อนการ์ดขึ้นหรือลง
      function moveCard(index, direction) {
        if (finished) return;

        var target = index + direction;

        if (target < 0 || target >= order.length) return;

        var temp = order[index];

        order[index] = order[target];
        order[target] = temp;

        var movedId = order[target];

        renderCards(movedId);

        if (highlightTimeout !== null) {
          clearTimeout(highlightTimeout);
        }

        highlightTimeout = setTimeout(function () {
          highlightTimeout = null;
        
          if (!finished) {
            renderCards(null);
          }
        }, 650);
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
          textContent: "เรียงเหตุการณ์จากเก่าที่สุดไปใหม่ที่สุด"
        });

        var cardList = App.ui.el("div", {
          id: "stage1-card-list",
          className: "stage1-card-list"
        });

        var submitBar = App.ui.el("div", {
          className: "stage1-submit-bar"
        });

        var submitButton = App.ui.el("button", {
          className: "btn stage1-submit-btn",
          type: "button",
          textContent: "ส่งคำตอบ"
        });

        addEvent(submitButton, "click", function () {
          if (finished) return;

          finish(false);
        });

        submitBar.appendChild(submitButton);

        container.appendChild(heading);
        container.appendChild(instruction);
        container.appendChild(cardList);
        container.appendChild(submitBar);

        shuffleCards();
        renderCards(null);

        timerBar = App.timer.renderBar(container, 1);

        timer = App.timer.create({
          durationSec: durationSec,

          onTick: function (remainingSec) {
            if (timerBar) {
              timerBar.update(remainingSec);
            }
          },

          onExpire: function () {
            if (finished) return;

            if (highlightTimeout !== null) {
              clearTimeout(highlightTimeout);
              highlightTimeout = null;
            }

            finished = true;

            // ล็อกปุ่มทั้งหมดทันที
            submitButton.disabled = true;

            var buttons = cardList.querySelectorAll("button");

            buttons.forEach(function (button) {
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

            // รอ 1.5 วินาทีก่อนส่งผล
            highlightTimeout = setTimeout(function () {
              highlightTimeout = null;

              if (finished) {
                finishTimeout();
              }
            }, 1500);
          }
        });

        timer.start();
      }

      // ส่งผลหลังหมดเวลา
      function finishTimeout() {
        if (!finished) return;

        var timeUsed = durationSec;

        cleanup();

        if (typeof options.onDone === "function") {
          options.onDone({
            answers: {
              order: order.slice()
            },
            timeUsedSec: timeUsed,
            timedOut: true
          });
        }
      }

      showIntroduction();
    }
  };
})();
