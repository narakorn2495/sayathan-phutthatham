
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
        createError(
          "ยังไม่ได้ตั้งค่า API_URL ใน js/config.js",
          "config"
        )
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
              "เซิร์ฟเวอร์ตอบกลับผิดพลาด (" +
                response.status +
                ")",
              "server"
            );
          }

          return response.json();
        })
        .then(function (data) {
          if (data && data.ok === false) {
            if (data.error === "busy") {
              throw createError(
                "เซิร์ฟเวอร์กำลังทำงาน กรุณาลองอีกครั้ง",
                "busy"
              );
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
            throw createError(
              "รูปแบบข้อมูลรายชื่อไม่ถูกต้อง",
              "data"
            );
          }

          rosterCache[className] = students;

          return students;
        })
        .finally(function () {
          clearTimeout(timeoutId);
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
        });
    }

    return attempt(0);
  }
    
  // สร้างรหัสประจำการส่งข้อมูล
    function createSubmissionId() {
      if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
      ) {
        return window.crypto.randomUUID();
      }
  
      var bytes = new Uint8Array(16);
  
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(bytes);
      } else {
        for (var i = 0; i < bytes.length; i++) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
      }
  
      return Array.from(bytes)
        .map(function (byte) {
          return byte.toString(16).padStart(2, "0");
        })
        .join("");
    }
  
    // ส่งผลคะแนนไปยัง Google Apps Script
    function submitResult(payload) {
      var config = window.App.config || {};
      var apiUrl = config.API_URL;
  
      if (
        !apiUrl ||
        apiUrl === "PASTE_APPS_SCRIPT_WEB_APP_URL_HERE" ||
        apiUrl.indexOf("PASTE_") !== -1
      ) {
        return Promise.reject(
          createError("ยังไม่ได้ตั้งค่า API_URL", "config")
        );
      }
  
      if (!payload || typeof payload !== "object") {
        return Promise.reject(
          createError("ข้อมูลผลการเล่นไม่ถูกต้อง", "data")
        );
      }
  
      var data = Object.assign({}, payload, {
        action: "submit",
        submission_id:
          payload.submission_id || createSubmissionId()
      });
  
      var body;
  
      try {
        body = JSON.stringify(data);
      } catch (error) {
        return Promise.reject(
          createError("ไม่สามารถแปลงข้อมูลเป็น JSON ได้", "data")
        );
      }
  
      function attempt(retryCount) {
        var controller = new AbortController();
  
        var timeoutId = setTimeout(function () {
          controller.abort();
        }, 20000);
  
        return fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: body,
          signal: controller.signal
        })
          .then(function (response) {
            if (!response.ok) {
              throw createError(
                "เซิร์ฟเวอร์ตอบกลับผิดพลาด (" +
                  response.status + ")",
                "server"
              );
            }
  
            return response.json();
          })
          .then(function (result) {
            if (!result || result.ok !== true) {
              if (result && result.error === "busy") {
                throw createError(
                  "เซิร์ฟเวอร์กำลังทำงาน กรุณาลองอีกครั้ง",
                  "busy"
                );
              }
  
              throw createError(
                (result && result.message) ||
                  "ไม่สามารถบันทึกผลคะแนนได้",
                "server"
              );
            }
  
            return result;
          })
          .finally(function () {
            clearTimeout(timeoutId);
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
                "หมดเวลารอการบันทึกคะแนน กรุณาตรวจสอบผลการบันทึก",
                "timeout"
              );
            }
  
            throw error;
          });
      }
  
      return attempt(0);
    }

      window.App.api = {
        getRoster: getRoster,
        submitResult: submitResult
      };
})();
