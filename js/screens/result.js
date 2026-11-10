
// js/screens/result.js
(function () {
  "use strict";

  var App = window.App;

  App.screens = App.screens || {};

  // แปลงจำนวนวินาทีเป็นข้อความเวลา
  function formatTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    var remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return minutes + " นาที " + remainingSeconds + " วินาที";
    }

    return remainingSeconds + " วินาที";
  }
  
  // เตรียมข้อมูลสำหรับส่งไปยัง Backend
  function createSubmissionPayload(student, stages, scores) {
    function getStageData(key) {
      var stage = stages[key];

      if (!stage) {
        throw new Error("ไม่พบข้อมูลผลการเล่น " + key);
      }

      var time = Number(stage.timeUsedSec);

      if (!Number.isFinite(time)) {
        throw new Error("ข้อมูลเวลาไม่ถูกต้อง " + key);
      }

      return {
        score: scores[key],
        time_sec: Math.min(125, Math.max(0, Math.round(time)))
      };
    }

    if (!student || !student.uid) {
      throw new Error("ไม่พบ UID ของนักเรียน");
    }

    return {
      action: "submit",
      uid: student.uid,

      s1: getStageData("s1"),
      s2: getStageData("s2"),
      s3: getStageData("s3"),

      answers: {
        s1: stages.s1.answers,
        s2: stages.s2.answers,
        s3: stages.s3.answers
      }
    };
  }

  App.screens.result = {
    enter: function (options) {
      options = options || {};

      App.ui.showScreen("result");

      var container = document.getElementById("result-content");
      container.textContent = "";

      // รับข้อมูลผลการเล่น
      var stages = options.stages ||
        (App.state && App.state.stages) || {};

      // สร้างพื้นที่แสดงผล
      var resultContainer = App.ui.el("div", {
        className: "result-container"
      });

      // คำนวณคะแนน
      var scores = App.scoring.scoreAll(stages);

      // สถานะการบันทึกคะแนน
      var saveStatus = App.ui.el("p", {
        className: "result-save-status",
        textContent: "กำลังบันทึกผลคะแนน..."
      });

saveStatus.setAttribute("role", "status");

      // ส่วนหัวและคะแนนรวม
      var header = App.ui.el("div", {
        className: "result-header"
      });

      var heading = App.ui.el("h2", {
        className: "result-title",
        textContent: "สรุปผลการทดสอบ"
      });

      var message = App.ui.el("p", {
        className: "result-student",
        textContent: "ยินดีด้วย! คุณเล่นเกมครบทั้ง 3 ด่านแล้ว"
      });

      var totalScore = App.ui.el("div", {
        className: "result-total",
        textContent: scores.total
      });

      var totalLabel = App.ui.el("div", {
        className: "result-total-label",
        textContent: "คะแนนรวมจาก 32 คะแนน"
      });

      header.appendChild(heading);
      header.appendChild(message);
      header.appendChild(totalScore);
      header.appendChild(totalLabel);
      header.appendChild(saveStatus);

      // ส่วนคะแนนแยกแต่ละด่าน
      var stageList = App.ui.el("div", {
        className: "result-stage-list"
      });

      var stageDetails = [
        {
          key: "s1",
          title: "ด่าน 1: เรียงลำดับเหตุการณ์",
          score: scores.s1,
          maxScore: 10
        },
        {
          key: "s2",
          title: "ด่าน 2: จับคู่ดินแดน",
          score: scores.s2,
          maxScore: 12
        },
        {
          key: "s3",
          title: "ด่าน 3: จำแนกพุทธแท้และพุทธปน",
          score: scores.s3,
          maxScore: 10
        }
      ];

      stageDetails.forEach(function (stage) {
        var card = App.ui.el("div", {
          className: "result-stage-card"
        });

        var title = App.ui.el("h3", {
          className: "result-stage-card__title",
          textContent: stage.title
        });

        var score = App.ui.el("div", {
          className: "result-stage-card__score",
          textContent: stage.score + " / " + stage.maxScore
        });

        card.appendChild(title);
        card.appendChild(score);

        // แสดงเวลาและสถานะหมดเวลา
        var stageResult = stages[stage.key];

        if (stageResult) {
          if (
            typeof stageResult.timeUsedSec === "number" &&
            isFinite(stageResult.timeUsedSec) &&
            stageResult.timeUsedSec >= 0
          ) {
            var time = App.ui.el("div", {
              className: "result-stage-card__time",
              textContent: "ใช้เวลา " +
                formatTime(stageResult.timeUsedSec)
            });

            card.appendChild(time);
          }

          if (stageResult.timedOut) {
            var timeout = App.ui.el("span", {
              className: "result-timeout",
              textContent: "หมดเวลา"
            });

            card.appendChild(timeout);
          }
        }

        stageList.appendChild(card);
      });

      // ปุ่มเล่นอีกครั้ง
      var actions = App.ui.el("div", {
        className: "result-actions"
      });

      var button = App.ui.el("button", {
        className: "btn result-play-again",
        type: "button",
        textContent: "เล่นอีกครั้ง"
      });

      button.addEventListener("click", function () {
        if (typeof options.onPlayAgain === "function") {
          options.onPlayAgain();
        }
      });

      actions.appendChild(button);

      // รวมองค์ประกอบทั้งหมด
      resultContainer.appendChild(header);
      resultContainer.appendChild(stageList);
      resultContainer.appendChild(actions);

      container.appendChild(resultContainer);
      // ส่งผลคะแนนไปยัง Google Sheets
        var student = options.student ||
          (App.state && App.state.student);
        
        try {
          var payload = createSubmissionPayload(
            student,
            stages,
            scores
          );
        
          App.api.submitResult(payload)
            .then(function (result) {
              saveStatus.textContent =
                "บันทึกคะแนนสำเร็จแล้ว ✓";
        
              saveStatus.classList.add("result-save-status--success");
        
              console.log("บันทึกคะแนนสำเร็จ:", result);
            })
            .catch(function (error) {
              saveStatus.textContent =
                "บันทึกคะแนนไม่สำเร็จ: " + error.message;
        
              saveStatus.classList.add("result-save-status--error");
        
              console.error("บันทึกคะแนนไม่สำเร็จ:", error);
            });
        
        } catch (error) {
          saveStatus.textContent =
            "ไม่สามารถเตรียมข้อมูลบันทึกคะแนน: " + error.message;
        
          saveStatus.classList.add("result-save-status--error");
        
          console.error(error);
        }
    }
  };
})();
