
// js/screens/start.js
(function () {
  "use strict";

  var App = window.App;

  App.screens = App.screens || {};

  App.screens.start = {
    enter: function () {
      App.ui.showScreen("start");

      var container = document.getElementById("start-content");
      container.textContent = "";

      var heading = App.ui.el("h2", {
        textContent: "ยินดีต้อนรับสู่สายธารพุทธธรรม"
      });

      var message = App.ui.el("p", {
        textContent: "Step 3 ยังไม่เสร็จ"
      });

      var description = App.ui.el("p", {
        className: "muted",
        textContent: "ขณะนี้กำลังทดสอบโครงสร้างเกม"
      });

      var button = App.ui.el("button", {
        className: "btn",
        type: "button",
        textContent: "เริ่มทดสอบเกม"
      });

      button.addEventListener("click", function () {
        var student = {
          uid: "test",
          name: "ทดสอบ",
          className: "ม.6/1"
        };

        App.main.begin(student);
      });

      container.appendChild(heading);
      container.appendChild(message);
      container.appendChild(description);
      container.appendChild(button);
    }
  };
})();

