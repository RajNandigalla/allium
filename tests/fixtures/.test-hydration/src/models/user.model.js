
    const { registerModel } = require('../../../packages/core/src/runtime/register-model');
    
    const hashPassword = async (data) => {
      console.log('Hashing password for', data.email);
      return data;
    };

    module.exports = {
      TestUser: registerModel('TestUser', {
        functions: {
          hashPassword
        }
      })
    };
  