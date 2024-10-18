module.exports = {
  "env": {
    "es6": true,
    "node": true,
    "mocha": true,
    "jquery": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module"
  },
  "rules": {
    "eol-last": ["error", "always"],
    "no-console": 0,
    "linebreak-style": [
      "error",
      "unix"
    ],
    "no-unused-vars": "off",
    "no-useless-escape": "off",
    "semi": [
      "error",
      "always"
    ]
  }
}
