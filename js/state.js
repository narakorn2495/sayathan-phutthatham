
// js/state.js
(function () {
  "use strict";

  window.App = window.App || {};

  var App = window.App;

  // สถานะเริ่มต้นของเกม
  App.state = {
    student: null,

    stages: {
      s1: null,
      s2: null,
      s3: null
    }
  };

  App.ui = App.ui || {};

  // แสดงหน้าที่ต้องการ
  App.ui.showScreen = function (name) {
    var screens = document.querySelectorAll(".screen");

    screens.forEach(function (screen) {
      screen.classList.remove("screen--active");
    });

    var target = document.getElementById("screen-" + name);

    if (target) {
      target.classList.add("screen--active");
    }
  };

  // สุ่มลำดับแบบ Fisher-Yates โดยไม่แก้อาร์เรย์เดิม
  App.ui.shuffle = function (array) {
    var result = Array.isArray(array) ? array.slice() : [];

    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));

      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }

    return result;
  };

  // ป้องกันอักขระ HTML ที่อาจเป็นอันตราย
  App.ui.escapeHtml = function (str) {
    return String(str == null ? "" : str).replace(
      /[&<>"']/g,
      function (char) {
        var entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        };

        return entities[char];
      }
    );
  };

  // สร้าง Element และกำหนดเนื้อหา
  App.ui.el = function (tag, attrs, children) {
    var element = document.createElement(tag);

    attrs = attrs || {};

    Object.keys(attrs).forEach(function (key) {
      var value = attrs[key];

      if (key === "className") {
        element.className = value;
      } else if (key === "textContent") {
        element.textContent = value;
      } else if (key === "disabled") {
        element.disabled = Boolean(value);
      } else if (key.indexOf("on") === 0 && typeof value === "function") {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value !== null && value !== undefined) {
        element.setAttribute(key, String(value));
      }
    });

    if (children !== null && children !== undefined) {
      var items = Array.isArray(children) ? children : [children];

      items.forEach(function (child) {
        if (child instanceof Node) {
          element.appendChild(child);
        } else if (child !== null && child !== undefined) {
          element.appendChild(
            document.createTextNode(String(child))
          );
        }
      });
    }

    return element;
  };
})();
