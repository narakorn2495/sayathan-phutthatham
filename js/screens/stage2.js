// js/screens/stage2.js
(function () {
  "use strict";

  var App = window.App;

  App.screens = App.screens || {};

  App.screens.stage2 = {
    enter: function (options) {
      options = options || {};

      App.ui.showScreen("stage2");

      var container = document.getElementById("stage2-content");
      if (!container) return;

      container.textContent = "";

      var gameData = window.GAME_DATA.stage2;
      var lands = gameData.lands;
      var traits = gameData.traits;
      var landIds = Object.keys(lands);
      var traitIds = Object.keys(traits);

      var config = App.config || {};
      var durationSec = Number(config.STAGE_TIME_SEC) || 120;

      var timer = null;
      var timerBar = null;
      var timeoutId = null;
      var listeners = [];

      var shuffledLands = [];
      var shuffledTraits = [];

      // รหัสการ์ดดินแดน -> รหัสการ์ดลักษณะ หรือ null
      var pairs = {};

      landIds.forEach(function (id) {
        pairs[id] = null;
      });

      var selectedLand = null;
      var started = false;
      var locked = false;
      var completed = false;
      var submitting = false;

      var landList = null;
      var traitList = null;
      var statusText = null;
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

      // ค้นหาดินแดนที่จับคู่กับการ์ดลักษณะ
      function findLandByTrait(traitId) {
        for (var i = 0; i < landIds.length; i++) {
          var landId = landIds[i];

          if (pairs[landId] === traitId) {
            return landId;
          }
        }

        return null;
      }

      // หาหมายเลขคู่สำหรับการ์ดดินแดน
      function getLandPairNumber(landId) {
        var index = landIds.indexOf(landId);

        if (pairs[landId] === null) {
          return null;
        }

        return index + 1;
      }

      // หาหมายเลขคู่สำหรับการ์ดลักษณะ
      function getTraitPairNumber(traitId) {
        var landId = findLandByTrait(traitId);

        if (landId === null) {
          return null;
        }

        return landIds.indexOf(landId) + 1;
      }

      // นับจำนวนคู่ที่จับแล้ว
      function matchedCount() {
        return landIds.filter(function (id) {
          return pairs[id] !== null;
        }).length;
      }

      // ยกเลิกคู่ของดินแดน
      function unpairLand(landId) {
        if (!landId || pairs[landId] === null) return;

        pairs[landId] = null;
      }

      // อัปเดตแถบสถานะ
      function updateStatus() {
        if (selectedLand !== null) {
          statusText.textContent =
            "เลือกลักษณะให้คู่กับ: " + lands[selectedLand];
        } else {
          statusText.textContent = "เลือกดินแดน";
        }

        progressText.textContent =
          "จับคู่แล้ว " + matchedCount() + " / " + landIds.length;
      }

      // แสดงข้อความแจ้งเตือน
      function showNotice(message, type) {
        noticeText.textContent = message;
        noticeText.className = "stage2-notice";

        if (type) {
          noticeText.classList.add("stage2-notice--" + type);
        }
      }

      function clearNotice() {
        noticeText.textContent = "";
        noticeText.className = "stage2-notice";
      }

      // สุ่มการ์ดทั้งสองกลุ่มแยกจากกัน
      function shuffleCards() {
        shuffledLands = App.ui.shuffle(landIds.slice());
        shuffledTraits = App.ui.shuffle(traitIds.slice());
      }

      // เลือกการ์ดดินแดน
      function selectLand(landId) {
        if (locked || completed) return;

        if (pairs[landId] !== null) {
          // แตะการ์ดที่จับคู่แล้วเพื่อยกเลิกคู่
          unpairLand(landId);
          selectedLand = landId;

          showNotice("ยกเลิกคู่แล้ว เลือกลักษณะใหม่ได้เลย", "info");
          renderBoard();
          return;
        }

        selectedLand = landId;
        clearNotice();

        renderBoard();
      }

      // เลือกการ์ดลักษณะเพื่อจับคู่
      function selectTrait(traitId) {
        if (locked || completed) return;

        if (selectedLand === null) {
          showNotice("กรุณาเลือกดินแดนก่อน แล้วจึงเลือกลักษณะ", "info");
          return;
        }

        var oldLand = findLandByTrait(traitId);

        // หากการ์ดลักษณะถูกจับคู่กับดินแดนอื่นอยู่
        // ให้ย้ายคู่มาเป็นดินแดนที่เลือก
        if (oldLand !== null) {
          if (oldLand === selectedLand) {
            // แตะการ์ดคู่เดิมเพื่อยกเลิกคู่
            unpairLand(oldLand);
            selectedLand = null;
          } else {
            // ยกเลิกคู่เดิม แล้วจับคู่ใหม่
            unpairLand(oldLand);
            pairs[selectedLand] = traitId;
            selectedLand = null;
          }
        } else {
          // จับคู่การ์ดที่ยังว่าง
          pairs[selectedLand] = traitId;
          selectedLand = null;
        }

        clearNotice();
        renderBoard();
      }

      // สร้างการ์ดหนึ่งใบ
      function createCard(id, text, group, pairNumber, isSelected) {
        var className = "stage2-card stage2-card--" + group;

        if (pairNumber !== null) {
          className += " stage2-pair--" + pairNumber;
        }

        if (isSelected) {
          className += " stage2-card--selected";
        }

        if (locked) {
          className += " stage2-card--locked";
        }

        var button = App.ui.el("button", {
          className: className,
          type: "button",
          disabled: locked,
          "data-id": id
        });

        var cardText = App.ui.el("span", {
          className: "stage2-card__text",
          textContent: text
        });

        button.appendChild(cardText);

        if (pairNumber !== null) {
          var badge = App.ui.el("span", {
            className: "stage2-card__number",
            textContent: "คู่ที่ " + pairNumber
          });

          button.appendChild(badge);
        }

        return button;
      }

      // แสดงการ์ดทั้งสองกลุ่ม
      function renderBoard() {
        landList.textContent = "";
        traitList.textContent = "";

        shuffledLands.forEach(function (landId) {
          var pairNumber = getLandPairNumber(landId);

          var card = createCard(
            landId,
            lands[landId],
            "land",
            pairNumber,
            selectedLand === landId
          );

          landList.appendChild(card);
        });

        shuffledTraits.forEach(function (traitId) {
          var pairNumber = getTraitPairNumber(traitId);

          var card = createCard(
            traitId,
            traits[traitId],
            "trait",
            pairNumber,
            false
          );

          traitList.appendChild(card);
        });

        updateStatus();

        if (submitButton) {
          submitButton.disabled = locked || submitting;
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

        var finalPairs = {};

        landIds.forEach(function (landId) {
          finalPairs[landId] = pairs[landId];
        });

        cleanup();

        if (typeof options.onDone === "function") {
          options.onDone({
            answers: {
              pairs: finalPairs
            },
            timeUsedSec: timedOut ? durationSec : timeUsed,
            timedOut: Boolean(timedOut)
          });
        }
      }

      // หน้าคำอธิบายก่อนเริ่ม
      function showIntroduction() {
        var heading = App.ui.el("h2", {
          className: "stage2-heading",
          textContent: "ด่านที่ 2"
        });

        var title = App.ui.el("h3", {
          className: "stage2-title",
          textContent: gameData.title
        });

        var instruction = App.ui.el("p", {
          className: "stage2-instruction",
          textContent: gameData.instruction
        });

        var pairInfo = App.ui.el("div", {
          className: "stage2-info",
          textContent: "🃏 มีทั้งหมด 6 คู่"
        });

        var timeInfo = App.ui.el("div", {
          className: "stage2-info",
          textContent: "⏱ เวลาทำกิจกรรม 2 นาที"
        });

        var button = App.ui.el("button", {
          className: "btn stage2-start-btn",
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
        container.appendChild(pairInfo);
        container.appendChild(timeInfo);
        container.appendChild(button);
      }

      // สร้างหน้ากิจกรรม
      function showGame() {
        container.textContent = "";

        var heading = App.ui.el("h2", {
          className: "stage2-heading",
          textContent: "ด่านที่ 2"
        });

        var instruction = App.ui.el("p", {
          className: "stage2-instruction",
          textContent: "เลือกดินแดนก่อน แล้วเลือกลักษณะที่สัมพันธ์กัน"
        });

        // แถบสถานะ
        var statusBar = App.ui.el("div", {
          className: "stage2-status"
        });

        statusText = App.ui.el("div", {
          className: "stage2-status__instruction",
          textContent: "เลือกดินแดน"
        });

        progressText = App.ui.el("div", {
          className: "stage2-status__progress",
          textContent: "จับคู่แล้ว 0 / 6"
        });

        statusBar.appendChild(statusText);
        statusBar.appendChild(progressText);

        noticeText = App.ui.el("div", {
          className: "stage2-notice",
          role: "status"
        });

        // กลุ่มดินแดน
        var landSection = App.ui.el("section", {
          className: "stage2-section"
        });

        var landTitle = App.ui.el("h3", {
          className: "stage2-section-title",
          textContent: "1. ดินแดน"
        });

        var landInstruction = App.ui.el("p", {
          className: "stage2-section-instruction",
          textContent: "แตะเลือกดินแดนที่ต้องการจับคู่"
        });

        landList = App.ui.el("div", {
          className: "stage2-card-list"
        });

        landSection.appendChild(landTitle);
        landSection.appendChild(landInstruction);
        landSection.appendChild(landList);

        // กลุ่มลักษณะ
        var traitSection = App.ui.el("section", {
          className: "stage2-section"
        });

        var traitTitle = App.ui.el("h3", {
          className: "stage2-section-title",
          textContent: "2. ลักษณะ"
        });

        var traitInstruction = App.ui.el("p", {
          className: "stage2-section-instruction",
          textContent: "แตะเลือกลักษณะที่สัมพันธ์กับดินแดนที่เลือก"
        });

        traitList = App.ui.el("div", {
          className: "stage2-card-list"
        });

        traitSection.appendChild(traitTitle);
        traitSection.appendChild(traitInstruction);
        traitSection.appendChild(traitList);

        // ปุ่มส่งคำตอบ
        var submitBar = App.ui.el("div", {
          className: "stage2-submit-bar"
        });

        submitButton = App.ui.el("button", {
          className: "btn stage2-submit-btn",
          type: "button",
          textContent: "ส่งคำตอบ"
        });

        submitBar.appendChild(submitButton);

        // เลือกดินแดน
        addEvent(landList, "click", function (event) {
          if (locked || completed) return;

          var target = event.target.closest("button[data-id]");

          if (!target || !landList.contains(target)) return;

          selectLand(target.getAttribute("data-id"));
        });

        // เลือกลักษณะ
        addEvent(traitList, "click", function (event) {
          if (locked || completed) return;

          var target = event.target.closest("button[data-id]");

          if (!target || !traitList.contains(target)) return;

          selectTrait(target.getAttribute("data-id"));
        });

        // ส่งคำตอบได้เสมอ แม้ยังจับคู่ไม่ครบ
        addEvent(submitButton, "click", function () {
          if (locked || completed || submitting) return;

          if (matchedCount() < landIds.length) {
            submitting = true;
            locked = true;

            showNotice(
              "ยังจับคู่ไม่ครบ ระบบจะส่งคำตอบตามที่ทำไว้",
              "warning"
            );

            renderBoard();

            timeoutId = setTimeout(function () {
              timeoutId = null;
              finish(false);
            }, 900);

            return;
          }

          finish(false);
        });

        container.appendChild(heading);
        container.appendChild(instruction);
        container.appendChild(statusBar);
        container.appendChild(noticeText);
        container.appendChild(landSection);
        container.appendChild(traitSection);
        container.appendChild(submitBar);

        shuffleCards();
        renderBoard();

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

            renderBoard();

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
