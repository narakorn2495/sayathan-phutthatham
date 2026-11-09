
// js/screens/start.js
(function () {
  "use strict";

  var App = window.App;

  App.screens = App.screens || {};

  App.screens.start = {
    enter: function () {
      App.ui.showScreen("start");

      var container = document.getElementById("start-content");

      if (!container) return;

      container.textContent = "";

      var config = App.config || {};
      var previousStudent =
        App.state && App.state.student
          ? App.state.student
          : null;

      var students = [];
      var selectedStudent = null;
      var loading = false;
      var starting = false;

      function createElement(tag, className, text) {
        var element = document.createElement(tag);

        if (className) {
          element.className = className;
        }

        if (text !== undefined) {
          element.textContent = text;
        }

        return element;
      }

      // ชื่อเกม
      container.appendChild(
        createElement(
          "h2",
          "",
          "ยินดีต้อนรับสู่สายธารพุทธธรรม"
        )
      );

      // คำอธิบายเกม 3 บรรทัด
      var description = createElement("div", "muted");

      description.appendChild(
        createElement("p", "", "มี 3 ด่าน ด่านละไม่เกิน 2 นาที")
      );

      description.appendChild(
        createElement("p", "", "ผลถูกผิดจะแสดงตอนท้ายเกม")
      );

      description.appendChild(
        createElement(
          "p",
          "",
          "เล่นซ้ำได้ (ระบบเก็บ 5 ครั้งล่าสุด)"
        )
      );

      container.appendChild(description);

      // ช่องเลือกห้อง
      var classLabel = createElement("label", "", "เลือกห้อง");
      classLabel.style.display = "block";
      classLabel.style.marginTop = "20px";

      var classSelect = createElement("select", "form-control");
      classSelect.style.display = "block";
      classSelect.style.width = "100%";

      var classPlaceholder = createElement(
        "option",
        "",
        "เลือกห้อง"
      );
      classPlaceholder.value = "";

      classSelect.appendChild(classPlaceholder);

      var classList = Array.isArray(config.CLASS_LIST)
        ? config.CLASS_LIST
        : [];

      classList.forEach(function (className) {
        var option = createElement("option", "", className);
        option.value = className;
        classSelect.appendChild(option);
      });

      classLabel.appendChild(classSelect);
      container.appendChild(classLabel);

      // ช่องเลือกชื่อ
      var nameLabel = createElement(
        "label",
        "",
        "เลือกชื่อของคุณ"
      );

      nameLabel.style.display = "block";
      nameLabel.style.marginTop = "16px";

      var nameSelect = createElement("select", "form-control");
      nameSelect.style.display = "block";
      nameSelect.style.width = "100%";
      nameSelect.disabled = true;

      var namePlaceholder = createElement(
        "option",
        "",
        "เลือกชื่อ"
      );
      namePlaceholder.value = "";

      nameSelect.appendChild(namePlaceholder);

      nameLabel.appendChild(nameSelect);
      container.appendChild(nameLabel);

      // ข้อความแจ้งครู
      container.appendChild(
        createElement(
          "p",
          "muted",
          "ไม่พบชื่อของฉัน? แจ้งครูเพื่อเพิ่มชื่อใน Roster"
        )
      );

      // สถานะการโหลดและข้อผิดพลาด
      var status = createElement("p", "muted", "");
      container.appendChild(status);

      // ปุ่มลองอีกครั้ง
      var retryButton = createElement(
        "button",
        "btn",
        "ลองอีกครั้ง"
      );

      retryButton.type = "button";
      retryButton.hidden = true;

      container.appendChild(retryButton);

      // ปุ่มเริ่มเล่น
      var startButton = createElement(
        "button",
        "btn",
        "เริ่มเล่น"
      );

      startButton.type = "button";
      startButton.disabled = true;

      startButton.style.marginTop = "20px";

      container.appendChild(startButton);

      function resetNameSelect() {
        students = [];
        selectedStudent = null;

        nameSelect.textContent = "";

        var placeholder = createElement(
          "option",
          "",
          "เลือกชื่อ"
        );

        placeholder.value = "";
        nameSelect.appendChild(placeholder);

        nameSelect.disabled = true;
        startButton.disabled = true;
      }

      function findPreviousStudent() {
        if (!previousStudent) return -1;

        for (var i = 0; i < students.length; i++) {
          if (
            previousStudent.uid &&
            students[i].uid === previousStudent.uid
          ) {
            return i;
          }
        }

        for (var j = 0; j < students.length; j++) {
          if (
            students[j].name === previousStudent.name
          ) {
            return j;
          }
        }

        return -1;
      }

      function updateStartButton() {
        startButton.disabled =
          loading ||
          starting ||
          !selectedStudent;
      }

      function loadRoster(className) {
        if (loading || !className) return;

        loading = true;
        retryButton.hidden = true;

        classSelect.disabled = true;
        status.textContent = "กำลังโหลดรายชื่อ…";

        resetNameSelect();

        App.api.getRoster(className)
          .then(function (result) {
            students = result;

            if (students.length === 0) {
              status.textContent =
                "ไม่พบรายชื่อของห้องนี้ แจ้งครูเพื่อเพิ่มชื่อใน Roster";

              return;
            }

            status.textContent = "";

            students.forEach(function (student, index) {
              var option = createElement(
                "option",
                "",
                student.name
              );

              option.value = String(index);
              nameSelect.appendChild(option);
            });

            nameSelect.disabled = false;

            // เลือกชื่อเดิมเมื่อกลับมาเล่นอีกครั้ง
            if (
              previousStudent &&
              previousStudent.className === className
            ) {
              var previousIndex = findPreviousStudent();

              if (previousIndex !== -1) {
                nameSelect.value = String(previousIndex);
                selectedStudent = students[previousIndex];
              }
            }

            updateStartButton();
          })
          .catch(function (error) {
            var message =
              error && error.message
                ? error.message
                : "เกิดข้อผิดพลาดในการโหลดรายชื่อ";

            status.textContent =
              "โหลดรายชื่อไม่สำเร็จ: " + message;

            retryButton.hidden = false;
          })
          .finally(function () {
            loading = false;
            classSelect.disabled = false;
            nameSelect.disabled = students.length === 0;

            updateStartButton();
          });
      }

      // เมื่อเลือกห้อง
      classSelect.addEventListener("change", function () {
        if (loading || starting) return;

        selectedStudent = null;
        status.textContent = "";
        retryButton.hidden = true;

        resetNameSelect();

        var className = classSelect.value;

        if (!className) return;

        loadRoster(className);
      });

      // เมื่อเลือกชื่อ
      nameSelect.addEventListener("change", function () {
        if (loading || starting) return;

        var index = nameSelect.value;

        selectedStudent =
          index !== "" && students[index]
            ? students[index]
            : null;

        updateStartButton();
      });

      // ลองโหลดรายชื่ออีกครั้ง
      retryButton.addEventListener("click", function () {
        if (loading || starting) return;

        loadRoster(classSelect.value);
      });

      // เริ่มเกม
      startButton.addEventListener("click", function () {
        if (
          loading ||
          starting ||
          !selectedStudent ||
          !classSelect.value
        ) {
          return;
        }

        starting = true;
        updateStartButton();

        classSelect.disabled = true;
        nameSelect.disabled = true;

        App.main.begin({
          uid: selectedStudent.uid,
          name: selectedStudent.name,
          className: classSelect.value
        });
      });

      // กรณีกลับมาเล่นอีกครั้ง ให้เลือกห้องเดิม
      if (
        previousStudent &&
        previousStudent.className &&
        classList.indexOf(previousStudent.className) !== -1
      ) {
        classSelect.value = previousStudent.className;
        loadRoster(previousStudent.className);
      }
    }
  };
})();
