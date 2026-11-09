
// js/api.js
(function () {
  "use strict";

  window.App = window.App || {};

  var rosterCache = Object.create(null);

  function createError(message, code) {
    var error = new Error(message);
    error.code = code || "error";
    return error;
  }

  function getRoster(className) {
    var config = window.App.config || {};
    var apiUrl = config.API_URL;

    if (
      !apiUrl ||
      apiUrl === "PASTE_APPS_SCRIPT_WEB_APP_URL_HERE" ||
      apiUrl.indexOf("PASTE_") !== -1
    ) {
      return Promise.reject(
        createError("ยังไม่ได้ตั้งค่า API_URL ใน js/config.js", "config")
      );
    }

    if (Object.prototype.hasOwnProperty.call(rosterCache, className)) {
      return Promise.resolve(rosterCache[className]);
    }

    var url =
      apiUrl +
      "?action=roster&class=" +
      encodeURIComponent(className);

    function attempt(retryCount) {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, 15000);

      return fetch(url, {
        method: "GET",
        signal: controller.signal
      })
        .then(function (response) {
          if (!response.ok) {
            throw createError(
              "เซิร์ฟเวอร์ตอบกลับผิดพลาด (" + response.status + ")",
              "server"
            );
          }

          return response.json();
        })
        .then(function (data) {
          if (data && data.ok === false) {
            if (data.error === "busy") {
              throw createError("เซิร์ฟเวอร์กำลังทำงาน กรุณาลองอีกครั้ง", "busy");
            }

            throw createError(
              data.message || "ไม่สามารถโหลดรายชื่อได้",
              "server"
            );
          }

          var students = Array.isArray(data)
            ? data
            : data && Array.isArray(data.students)
              ? data.students
              : null;

          if (!students) {
            throw createError("รูปแบบข้อมูลรายชื่อไม่ถูกต้อง", "data");
          }

          rosterCache[className] = students;
          return students;
        })
        .catch(function (error) {
          var shouldRetry =
            error.name === "AbortError" ||
            error instanceof TypeError ||
            error.code === "busy";

          if (shouldRetry && retryCount < 2) {
            return attempt(retryCount + 1);
          }

          if (error.name === "AbortError") {
            throw createError(
              "หมดเวลารอการเชื่อมต่อ กรุณาลองอีกครั้ง",
              "timeout"
            );
          }

          throw error;
        })
        .finally(function () {
          clearTimeout(timeoutId);
        });
    }

    return attempt(0);
  }

  window.App.api = {
    getRoster: getRoster,

    // จะพัฒนาระบบบันทึกผลใน Step 7
    submitResult: function () {
      return Promise.reject(
        new Error("ระบบบันทึกผลยังไม่พร้อมใช้งาน")
      );
    }
  };
})();
