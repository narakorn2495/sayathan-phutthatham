
// js/screens/stage3.js
(function () {
  "use strict";

  var App = window.App;

  App.screens = App.screens || {};

  App.screens.stage3 = {
    enter: function (options) {
      options = options || {};

      App.ui.showScreen("stage3");

      var container = document.getElementById("stage3-content");
      if (!container) return;

      container.textContent = "";

      var gameData = window.GAME_DATA.stage3;
      var cards = gameData.cards;
      var labels = gameData.labels;

      var config = App.config || {};
      var durationSec = Number(config.STAGE_TIME_SEC) || 120;

      var timer = null;
      var timerBar = null;
      var timeoutId = null;
      var listeners = [];

      // เก็บคำตอบตามรหัสการ์ด
      var answers = {};

      cards.forEach(function (card) {
        answers[card.id] = null;
      });

      var shuffledCards = [];

      var started = false;
      var locked = false;
      var completed = false;
      var submitting = false;

      var cardList = null;
      var progressText = null;
      var noticeText = null;
      var submitButton = null;

      // จัดการ Event เพื่อให้ล้างได้เมื่อจบด่าน
      function addEvent(element, eventName, handler) {
        element.addEventListener(eventName, handler);

        listeners.push({
          element: element,
          eventName: eventName,
          handler: handler
        });
      }

      // ล้าง Timer และ Event ทั้งหมด
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

      // นับจำนวนคำตอบที่เลือกแล้ว
      function answeredCount() {
        return cards.filter(function (card) {
          return answers[card.id] !== null;
        }).length;
      }

      // แสดงจำนวนคำตอบ
      function updateProgress() {
        progressText.textContent =
          "ตอบแล้ว " + answeredCount() + " / " + cards.length;
      }

      // แสดงข้อความแจ้งเตือน
      function showNotice(message, type) {
        noticeText.textContent = message;
        noticeText.className = "stage3-notice";

        if (type) {
          noticeText.classList.add("stage3-notice--" + type);
        }
      }

      function clearNotice() {
        noticeText.textContent = "";
        noticeText.className = "stage3-notice";
      }

      // ส่งผลลัพธ์เพียงครั้งเดียว
      function finish(timedOut) {
        if (completed) return;

        completed = true;
        locked = true;

        var timeUsed = timer
          ? timer.elapsedSec()
          : 0;

        // สร้างข้อมูลคำตอบให้ครบทั้ง 10 ใบ
        var finalLabels = {};

        cards.forEach(function (card) {
          finalLabels[card.id] = answers[card.id];
        });

        cleanup();

        if (typeof options.onDone === "function") {
          options.onDone({
            answers: {
              labels: finalLabels
            },
            timeUsedSec: timedOut ? durationSec : timeUsed,
            timedOut: Boolean(timedOut)
          });
        }
      }

      // สุ่มลำดับการ์ดทั้ง 10 ใบ
      function shuffleCards() {
        shuffledCards = App.ui.shuffle(cards.slice());
      }

      // เลือกหรือยกเลิกคำตอบ
      function selectLabel(cardId, label) {
        if (locked || completed || submitting) return;

        if (!Object.prototype.hasOwnProperty.call(answers, cardId)) {
          return;
        }

        if (label !== "pure" && label !== "mixed") {
          return;
        }

        // แตะปุ่มเดิมซ้ำเพื่อล้างคำตอบ
        if (answers[cardId] === label) {
          answers[cardId] = null;
        } else {
          answers[cardId] = label;
        }

        clearNotice();
        renderCards();
      }

      // สร้างการ์ดหนึ่งใบ
      function createCard(card) {
        var selected = answers[card.id];

        var cardElement = App.ui.el("article", {
          className: "stage3-card"
        });

        var cardText = App.ui.el("div", {
          className: "stage3-card__text",
          textContent: card.text
        });

        var buttonGroup = App.ui.el("div", {
          className: "stage3-card__buttons"
        });

        // ปุ่มพุทธแท้
        var pureButton = App.ui.el("button", {
          className: "stage3-label-btn stage3-label-btn--pure" +
            (selected === "pure" ? " stage3-label-btn--selected" : ""),
          type: "button",
          disabled: locked,
          "data-card-id": card.id,
          "data-label": "pure",
          "aria-pressed": String(selected === "pure")
        });

        pureButton.appendChild(
          App.ui.el("span", {
            textContent: labels.pure
          })
        );

        if (selected === "pure") {
          pureButton.appendChild(
            App.ui.el("span", {
              className: "stage3-label-check",
              textContent: "✓"
            })
          );
        }

        // ปุ่มพุทธปน
        var mixedButton = App.ui.el("button", {
          className: "stage3-label-btn stage3-label-btn--mixed" +
            (selected === "mixed" ? " stage3-label-btn--selected" : ""),
          type: "button",
          disabled: locked,
          "data-card-id": card.id,
          "data-label": "mixed",
          "aria-pressed": String(selected === "mixed")
        });

        mixedButton.appendChild(
          App.ui.el("span", {
            textContent: labels.mixed
          })
        );

        if (selected === "mixed") {
          mixedButton.appendChild(
            App.ui.el("span", {
              className: "stage3-label-check",
              textContent: "✓"
            })
          );
        }

        buttonGroup.appendChild(pureButton);
        buttonGroup.appendChild(mixedButton);

        cardElement.appendChild(cardText);
        cardElement.appendChild(buttonGroup);

        return cardElement;
      }

      // แสดงการ์ดทั้งหมด
      function renderCards() {
        cardList.textContent = "";

        shuffledCards.forEach(function (card) {
          cardList.appendChild(createCard(card));
        });

        updateProgress();

        if (submitButton) {
          submitButton.disabled = locked || submitting;
        }
      }

      // หน้าคำอธิบายก่อนเริ่ม
      function showIntroduction() {
        var heading = App.ui.el("h2", {
          className: "stage3-heading",
          textContent: "ด่านที่ 3"
        });

        var title = App.ui.el("h3", {
          className: "stage3-title",
          textContent: gameData.title
        });

        var instruction = App.ui.el("p", {
          className: "stage3-instruction",
          textContent: gameData.instruction
        });

        var cardInfo = App.ui.el("div", {
          className: "stage3-info",
          textContent: "🃏 มีการ์ดทั้งหมด 10 ใบ"
        });

        var timeInfo = App.ui.el("div", {
          className: "stage3-info",
          textContent: "⏱ เวลาทำกิจกรรม 2 นาที"
        });

        var button = App.ui.el("button", {
          className: "btn stage3-start-btn",
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
        container.appendChild(cardInfo);
        container.appendChild(timeInfo);
        container.appendChild(button);
      }

      // สร้างหน้ากิจกรรม
      function showGame() {
        container.textContent = "";

        var heading = App.ui.el("h2", {
          className: "stage3-heading",
          textContent: "ด่านที่ 3"
        });

        var instruction = App.ui.el("p", {
          className: "stage3-instruction",
          textContent: gameData.instruction
        });

        // แถบจำนวนคำตอบแบบ Sticky
        var statusBar = App.ui.el("div", {
          className: "stage3-status"
        });

        progressText = App.ui.el("div", {
          className: "stage3-status__progress",
          textContent: "ตอบแล้ว 0 / 10"
        });

        statusBar.appendChild(progressText);

        // พื้นที่แจ้งเตือน
        noticeText = App.ui.el("div", {
          className: "stage3-notice",
          role: "status"
        });

        // รายการการ์ด
        cardList = App.ui.el("div", {
          className: "stage3-card-list"
        });

        // ปุ่มส่งคำตอบ
        var submitBar = App.ui.el("div", {
          className: "stage3-submit-bar"
        });

        submitButton = App.ui.el("button", {
          className: "btn stage3-submit-btn",
          type: "button",
          textContent: "ส่งคำตอบ"
        });

        submitBar.appendChild(submitButton);

        // เลือกประเภทจากปุ่มในการ์ด
        addEvent(cardList, "click", function (event) {
          if (locked || completed || submitting) return;

          var target = event.target.closest(
            "button[data-card-id][data-label]"
          );

          if (!target || !cardList.contains(target)) return;

          selectLabel(
            target.getAttribute("data-card-id"),
            target.getAttribute("data-label")
          );
        });

        // ส่งคำตอบได้แม้ยังตอบไม่ครบ
        addEvent(submitButton, "click", function () {
          if (locked || completed || submitting) return;

          if (answeredCount() < cards.length) {
            submitting = true;
            locked = true;

            timer.stop();

            showNotice(
              "ยังตอบไม่ครบ ระบบจะส่งคำตอบตามที่ทำไว้",
              "warning"
            );

            renderCards();

            timeoutId = setTimeout(function () {
              timeoutId = null;
              finish(false);
            }, 700);

            return;
          }

          finish(false);
        });

        container.appendChild(heading);
        container.appendChild(instruction);
        container.appendChild(statusBar);
        container.appendChild(noticeText);
        container.appendChild(cardList);
        container.appendChild(submitBar);

        // สุ่มการ์ดก่อนแสดง
        shuffleCards();
        renderCards();

        // ใช้ตัวจับเวลาร่วมของระบบ
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

            // ล็อกการ์ดทุกใบ
            renderCards();

            if (timerBar) {
              timerBar.update(0);
            }

            showNotice("⏰ หมดเวลา!", "timeout");

            timeoutId = setTimeout(function () {
              timeoutId = null;
              finish(true);
            }, 1500);
          }
        });

        timer.start();
      }

      showIntroduction();
    }
  };
})();
