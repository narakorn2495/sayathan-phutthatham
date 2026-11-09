
(function () {
  "use strict";

  var App = window.App;
  var gameData = window.GAME_DATA;

  App.scoring = {};

  // ========================================
  // ด่าน 1: เรียงลำดับเหตุการณ์
  // ========================================

  App.scoring.scoreStage1 = function (answers) {
    var order = answers && Array.isArray(answers.order)
      ? answers.order
      : [];

    var correctOrder = gameData.stage1.answerOrder;
    var wrongCount = 0;

    for (var i = 0; i < correctOrder.length; i++) {
      if (order[i] !== correctOrder[i]) {
        wrongCount++;
      }
    }

    // อนุญาตให้สลับการ์ด 1-07 และ 1-08
    if (App.config.STAGE1_ACCEPT_SWAP_07_08) {
      var index07 = correctOrder.indexOf("1-07");
      var index08 = correctOrder.indexOf("1-08");

      if (
        order[index07] === "1-08" &&
        order[index08] === "1-07"
      ) {
        wrongCount -= 2;
      }
    }

    return Math.max(0, correctOrder.length - wrongCount);
  };


  // ========================================
  // ด่าน 2: จับคู่ดินแดนกับลักษณะ
  // ========================================

  App.scoring.scoreStage2 = function (answers) {
    var pairs = answers && answers.pairs
      ? answers.pairs
      : {};

    var correctPairs = gameData.stage2.answerPairs;
    var score = 0;

    Object.keys(correctPairs).forEach(function (landId) {
      if (pairs[landId] === correctPairs[landId]) {
        score += gameData.stage2.pointsPerPair;
      }
    });

    return score;
  };


  // ========================================
  // ด่าน 3: จำแนกพุทธแท้และพุทธปน
  // ========================================

  App.scoring.scoreStage3 = function (answers) {
    var labels = answers && answers.labels
      ? answers.labels
      : {};

    var cards = gameData.stage3.cards;
    var score = 0;

    cards.forEach(function (card) {
      if (labels[card.id] === card.answer) {
        score += gameData.stage3.pointsPerCard;
      }
    });

    return score;
  };


  // ========================================
  // รวมคะแนนทั้ง 3 ด่าน
  // ========================================

  App.scoring.scoreAll = function (stages) {
    stages = stages || {};

    var s1 = App.scoring.scoreStage1(
      stages.s1 && stages.s1.answers
    );

    var s2 = App.scoring.scoreStage2(
      stages.s2 && stages.s2.answers
    );

    var s3 = App.scoring.scoreStage3(
      stages.s3 && stages.s3.answers
    );

    return {
      s1: s1,
      s2: s2,
      s3: s3,
      total: s1 + s2 + s3
    };
  };


  // ========================================
  // ทดสอบระบบคิดคะแนน
  // ========================================

  App.scoring.selfTest = function () {
    var passed = 0;
    var failed = 0;

    function test(name, actual, expected) {
      var success = actual === expected;

      if (success) {
        passed++;
      } else {
        failed++;
      }

      console.log(
        (success ? "ผ่าน ✓ " : "ไม่ผ่าน ✗ ") +
        name +
        " | ได้ " + actual +
        " | คาดหวัง " + expected
      );
    }

    // 1. ถูกทั้งหมด
    var perfectStages = {
      s1: {
        answers: {
          order: gameData.stage1.answerOrder.slice()
        }
      },
      s2: {
        answers: {
          pairs: Object.assign({}, gameData.stage2.answerPairs)
        }
      },
      s3: {
        answers: {
          labels: {}
        }
      }
    };

    gameData.stage3.cards.forEach(function (card) {
      perfectStages.s3.answers.labels[card.id] = card.answer;
    });

    var perfect = App.scoring.scoreAll(perfectStages);

    test("ด่าน 1 ถูกทั้งหมด", perfect.s1, 10);
    test("ด่าน 2 ถูกทั้งหมด", perfect.s2, 12);
    test("ด่าน 3 ถูกทั้งหมด", perfect.s3, 10);
    test("คะแนนรวม", perfect.total, 32);


    // 2. เรียงกลับด้านทั้งหมด
    var reversed = gameData.stage1.answerOrder
      .slice()
      .reverse();

    test(
      "ด่าน 1 เรียงกลับด้าน",
      App.scoring.scoreStage1({ order: reversed }),
      0
    );


    // 3. ทดสอบสลับการ์ด 1-07 และ 1-08
    var swapped = gameData.stage1.answerOrder.slice();

    var index07 = swapped.indexOf("1-07");
    var index08 = swapped.indexOf("1-08");

    var temp = swapped[index07];
    swapped[index07] = swapped[index08];
    swapped[index08] = temp;

    var originalConfig = App.config.STAGE1_ACCEPT_SWAP_07_08;

    App.config.STAGE1_ACCEPT_SWAP_07_08 = false;

    test(
      "สลับ 1-07 และ 1-08 เมื่อปิดการยอมรับ",
      App.scoring.scoreStage1({ order: swapped }),
      8
    );

    App.config.STAGE1_ACCEPT_SWAP_07_08 = true;

    test(
      "สลับ 1-07 และ 1-08 เมื่อเปิดการยอมรับ",
      App.scoring.scoreStage1({ order: swapped }),
      10
    );

    App.config.STAGE1_ACCEPT_SWAP_07_08 = originalConfig;


    // 4. ด่าน 2 ถูก 3 คู่ ที่เหลือไม่ตอบ
    var threePairs = {};

    Object.keys(gameData.stage2.answerPairs)
      .forEach(function (landId, index) {
        threePairs[landId] = index < 3
          ? gameData.stage2.answerPairs[landId]
          : null;
      });

    test(
      "ด่าน 2 ถูก 3 คู่",
      App.scoring.scoreStage2({ pairs: threePairs }),
      6
    );


    // 5. ด่าน 3 ถูก 7 ผิด 2 ไม่ตอบ 1
    var sevenCorrect = {};

    gameData.stage3.cards.forEach(function (card, index) {
      if (index < 7) {
        sevenCorrect[card.id] = card.answer;
      } else if (index < 9) {
        sevenCorrect[card.id] =
          card.answer === "pure" ? "mixed" : "pure";
      } else {
        sevenCorrect[card.id] = null;
      }
    });

    test(
      "ด่าน 3 ถูก 7 ผิด 2 ไม่ตอบ 1",
      App.scoring.scoreStage3({ labels: sevenCorrect }),
      7
    );


    // 6. ด่าน 2 และ 3 ไม่ตอบเลย
    test(
      "ด่าน 2 ไม่ตอบ",
      App.scoring.scoreStage2({ pairs: {} }),
      0
    );

    test(
      "ด่าน 3 ไม่ตอบ",
      App.scoring.scoreStage3({ labels: {} }),
      0
    );


    console.log("------------------------------");
    console.log(
      "สรุปผลทดสอบ: ผ่าน " + passed +
      " รายการ / ไม่ผ่าน " + failed + " รายการ"
    );
    console.log("------------------------------");

    return failed === 0;
  };

})();
