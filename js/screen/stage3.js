
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
      container.textContent = "";

      var heading = App.ui.el("h2", {
        textContent: "ด่านที่ 3"
      });

      var title = App.ui.el("h3", {
        textContent: window.GAME_DATA.stage3.title
      });

      var instruction = App.ui.el("p", {
        textContent: window.GAME_DATA.stage3.instruction
      });

      var message = App.ui.el("p", {
        className: "muted",
        textContent: "ระบบด่านนี้ยังอยู่ระหว่างพัฒนา"
      });

      var button = App.ui.el("button", {
        className: "btn",
        type: "button",
        textContent: "ข้ามไปด่านถัดไป"
      });

      button.addEventListener("click", function () {
        button.disabled = true;

        if (typeof options.onDone === "function") {
          options.onDone({
            answers: {},
            timeUsedSec: 0,
            timedOut: false
          });
        }
      });

      container.appendChild(heading);
      container.appendChild(title);
      container.appendChild(instruction);
      container.appendChild(message);
      container.appendChild(button);
    }
  };
})();
