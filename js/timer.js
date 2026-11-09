
// js/timer.js
(function () {
  "use strict";

  window.App = window.App || {};
  var App = window.App;

  App.timer = {};

  // สร้างตัวจับเวลาโดยอิงเวลาสิ้นสุดจริง
  App.timer.create = function (options) {
    options = options || {};

    var durationSec = Math.max(
      1,
      Math.floor(Number(options.durationSec) || 120)
    );

    var onTick = options.onTick;
    var onExpire = options.onExpire;

    var startTime = null;
    var endTime = null;
    var intervalId = null;
    var started = false;
    var stopped = false;
    var expired = false;

    function elapsed() {
      if (startTime === null) return 0;

      var value = Math.floor((Date.now() - startTime) / 1000);

      return Math.min(durationSec, Math.max(0, value));
    }

    function remaining() {
      if (startTime === null) return durationSec;
      if (expired) return 0;
      if (stopped) {
        return Math.max(
          0,
          durationSec - elapsed()
        );
      }

      return Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000)
      );
    }

    function clearIntervalTimer() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function tick() {
      if (!started || stopped || expired) return;

      var left = remaining();

      if (typeof onTick === "function") {
        onTick(left);
      }

      if (left <= 0) {
        expired = true;
        started = false;

        clearIntervalTimer();

        if (typeof onExpire === "function") {
          onExpire();
        }
      }
    }

    return {
      start: function () {
        if (started || stopped || expired) return;

        started = true;
        startTime = Date.now();
        endTime = startTime + durationSec * 1000;

        tick();

        if (started) {
          intervalId = setInterval(tick, 250);
        }
      },

      stop: function () {
        if (stopped) return;

        stopped = true;
        started = false;
        clearIntervalTimer();
      },

      elapsedSec: function () {
        return elapsed();
      },

      remainingSec: function () {
        return remaining();
      }
    };
  };

  // สร้างแถบเวลาที่ใช้ร่วมกันได้ทุกด่าน
  App.timer.renderBar = function (container, stageNumber) {
    var config = App.config || {};

    var duration = Number(config.STAGE_TIME_SEC) || 120;

    var bar = App.ui.el("div", {
      className: "game-timer"
    });

    var label = App.ui.el("div", {
      className: "game-timer__label"
    });

    var progressTrack = App.ui.el("div", {
      className: "game-timer__track"
    });

    var progress = App.ui.el("div", {
      className: "game-timer__progress",
      role: "progressbar",
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuenow": "100"
    });

    progressTrack.appendChild(progress);
    bar.appendChild(label);
    bar.appendChild(progressTrack);

    container.insertBefore(bar, container.firstChild);

    function formatTime(seconds) {
      var minutes = Math.floor(seconds / 60);
      var secs = seconds % 60;

      return String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0");
    }

    function update(seconds) {
      seconds = Math.max(0, Math.min(duration, seconds));

      var percent = (seconds / duration) * 100;

      var warning = seconds <= 15;

      label.textContent =
        "ด่านที่ " + stageNumber +
        " • " +
        (warning ? "⚠ ใกล้หมดเวลา! " : "เหลือ ") +
        formatTime(seconds);

      progress.style.width = percent + "%";

      progress.setAttribute(
        "aria-valuenow",
        String(Math.round(percent))
      );

      bar.classList.toggle(
        "game-timer--warning",
        warning
      );

      bar.classList.toggle(
        "game-timer--expired",
        seconds === 0
      );
    }

    update(duration);

    return {
      element: bar,
      update: update,
      remove: function () {
        if (bar.parentNode) {
          bar.parentNode.removeChild(bar);
        }
      }
    };
  };
})();
