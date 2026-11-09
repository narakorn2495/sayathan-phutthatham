
// js/main.js
(function () {
  "use strict";

  var App = window.App;

  // ควบคุมลำดับการทำงานของเกม
  App.main = {

    // เริ่มเกมใหม่
    begin: function (student) {
      App.state = {
        student: student,

        stages: {
          s1: null,
          s2: null,
          s3: null
        }
      };

      App.screens.stage1.enter({
        onDone: function (result) {
          App.state.stages.s1 = result;

          App.screens.stage2.enter({
            onDone: function (result) {
              App.state.stages.s2 = result;

              App.screens.stage3.enter({
                onDone: function (result) {
                  App.state.stages.s3 = result;

                  App.screens.result.enter({
                    student: App.state.student,
                    stages: App.state.stages,

                    onPlayAgain: function () {
                      App.main.playAgain();
                    }
                  });
                }
              });
            }
          });
        }
      });
    },

    // กลับไปหน้าเริ่มเกม
    playAgain: function () {
      App.state = {
        student: null,

        stages: {
          s1: null,
          s2: null,
          s3: null
        }
      };

      App.screens.start.enter();
    }
  };

  // เปิดหน้าเริ่มเกมเมื่อเอกสารพร้อม
  function initializeApp() {
    App.screens.start.enter();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeApp
    );
  } else {
    initializeApp();
  }
})();
