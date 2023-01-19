/* eslint-disable no-cond-assign */
const { set, get } = require('lodash');

/**
 * Parse SQM simple data into JS equivalent
 *
 * @param {string} v  The simple data
 *
 * @returns The same, in JS equivalent
 */
const parseSQMData = (v) => {
  const value = v
    .replace(/(,|;)$/gi, '')
    .replace(/^"|"$/gi, '')
    .replace(/""/gi, '\\"')
    .replace(/" ?\\n ?"/gi, '\n');

  if (!Number.isNaN(+value)) {
    return +value;
  }
  return value;
};

/**
 * Parse SQM into a usable object
 *
 * @param {string} content The content of the SQM
 *
 * @returns {object} The parsed SQM
 */
const parseSQM = (content) => {
  const lines = content.split('\n');

  const sqm = {};
  const objStack = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const line of lines) {
    const data = line.trim();
    try {
      let matches = [];

      if ((matches = /^class (?<claName>.*)$|^(?<arrName>.*)\[\]=$/i.exec(data)) !== null) {
        // Class start
        // Array start
        const key = matches?.groups?.arrName || matches?.groups?.claName;
        if (!key) {
          throw new Error('object/array key is undefined');
        }

        const isArray = matches?.groups?.arrName || false;
        objStack.push(key);
        set(sqm, objStack, isArray ? [] : {});
      } else if ((matches = /^(.*)\[\]=\{(.*)\};$/i.exec(data)) !== null) {
        // Inline Array
        set(sqm, [...objStack, matches[1]], matches[2].split(',').map(parseSQMData));
      } else if (/^};$/.test(data)) {
        // Class end
        // Array end
        objStack.pop();
      } else if (/^{$/.test(data)) {
        // Nothing
      } else if (/^.*;$/.test(data)) {
        // Simple value
        const [key, v] = data.split('=');
        set(sqm, [...objStack, key], parseSQMData(v));
      } else if (objStack.length > 0) {
        const obj = get(sqm, objStack);
        if (Array.isArray(obj)) {
          // Array item
          obj.push(parseSQMData(data));
        }
      }
    } catch (error) {
      console.error(error);
      throw new Error(`Unable to parse : ${data}`);
    }
  }
  return sqm;
};

exports = parseSQM;
