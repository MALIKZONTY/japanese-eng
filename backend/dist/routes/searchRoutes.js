"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const searchController_1 = require("../controllers/searchController");
const router = (0, express_1.Router)();
router.post('/', searchController_1.search);
router.post('/related', searchController_1.searchRelated);
exports.default = router;
