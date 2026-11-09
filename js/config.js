
// js/config.js
(function () {
  "use strict";

  window.App = window.App || {};

  // ค่าตั้งค่ากลางของเกม
  window.App.config = {
    API_URL: "https://script.google.com/macros/s/AKfycbz234hokvyN0R5hmexmYGkhyDcwV33HO7Gl-Ct3imERygHPqMDz4S20uqWmI886kTU/exec",

    CLASS_LIST: [
      "ม.6/1",
      "ม.6/2",
      "ม.6/3",
      "ม.6/4",
      "ม.6/5",
      "ม.6/6"
    ],

    STAGE_TIME_SEC: 120,

    STAGE1_ACCEPT_SWAP_07_08: false,

    LEARNING_LINKS: {
      all: {
        label: "แหล่งเรียนรู้รวม",
        url: "PASTE_GOOGLE_DRIVE_LINK_HERE"
      },

      stage1: {
        label: "แหล่งเรียนรู้ด่านที่ 1",
        url: "PASTE_GOOGLE_DRIVE_LINK_HERE"
      },

      stage2: {
        label: "แหล่งเรียนรู้ด่านที่ 2",
        url: "PASTE_GOOGLE_DRIVE_LINK_HERE"
      },

      stage3: {
        label: "แหล่งเรียนรู้ด่านที่ 3",
        url: "PASTE_GOOGLE_DRIVE_LINK_HERE"
      }
    },

    SUBMIT_RETRY: {
      maxAttempts: 5,
      baseDelayMs: 1000
    }
  };
})();

