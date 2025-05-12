const express = require("express");
const router = express.Router();
const apiExternaController = require("../controllers/apiExternaController");

router.post(
  "/",
//   validarJWT,
//   validarPerfil(["ADMINISTRADOR"]),
  apiExternaController.consultarApiExterna
);

module.exports = router;