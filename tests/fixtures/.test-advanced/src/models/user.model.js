
    const { registerModel } = require('../../../packages/core/src/runtime/register-model');
    
    const customMask = (val) => 'MASKED-' + val;
    const calculateTax = (record) => record.price * 1.2;

    module.exports = {
      TestUser: registerModel('TestUser', {
        functions: {
          customMask,
          calculateTax
        }
      })
    };
  