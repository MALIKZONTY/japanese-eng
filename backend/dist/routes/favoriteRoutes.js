"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wordController_1 = require("../controllers/wordController");
const router = (0, express_1.Router)();
router.post('/:id', wordController_1.addFavorite);
router.delete('/:id', wordController_1.removeFavorite);
exports.default = router;
