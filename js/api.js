
// js/api.js
(function () {
  "use strict";

  window.App = window.App || {};

  // โมดูลเชื่อมต่อ Google Apps Script จะพัฒนาใน Step 2
  window.App.api = {
    getRoster: function () {
      return Promise.reject(
        new Error("ระบบรายชื่อยังไม่พร้อมใช้งาน")
      );
    },

    submitResult: function () {
      return Promise.reject(
        new Error("ระบบบันทึกผลยังไม่พร้อมใช้งาน")
      );
    }
  };
})();
