
// js/screens/result.js
(function () {
  "use strict";

  var App = window.App;

  App.screens = App.screens || {};

  App.screens.result = {
    enter: function (options) {
      options = options || {};

      App.ui.showScreen("result");

      var container = document.getElementById("result-content");
      container.textContent = "";

      var heading = App.ui.el("h2", {
        textContent: "สรุปผลการทดสอบ"
      });

      var message = App.ui.el("p", {
        textContent: "จบการทดสอบโครงสร้างเกมแล้ว"
      });

      var stateHeading = App.ui.el("h3", {
        textContent: "ข้อมูลสถานะการเล่น"
      });

      var stateContent = App.ui.el("pre", {
        className: "game-card"
      });

      // แสดงสถานะด้วย textContent เพื่อความปลอดภัย
      stateContent.textContent = JSON.stringify(
        App.state,
        null,
        2
      );

      stateContent.style.whiteSpace = "pre-wrap";
      stateContent.style.overflowWrap = "anywhere";
      stateContent.style.fontSize = "14px";

      var button = App.ui.el("button", {
        className: "btn",
        type: "button",
        textContent: "เล่นอีกครั้ง"
      });

      button.addEventListener("click", function () {
        if (typeof options.onPlayAgain === "function") {
          options.onPlayAgain();
        }
      });

      container.appendChild(heading);
      container.appendChild(message);
      container.appendChild(stateHeading);
      container.appendChild(stateContent);
      container.appendChild(button);
    }
  };
})();
