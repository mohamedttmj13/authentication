const nodemailer = require('nodemailer');

//Establish connection to the email server
exports.transporter = nodemailer.createTransport({
    service: 'gmail',
    auth : {
        user : process.env.EMAIL,
        pass : process.env.PASSWORD
    }
});


//Set email otipons
let passwordToHandle ="";

exports.generatedPassword = ()=>{
    const newPassword = [];
    let password = "";

    while(newPassword.length < 10){
        for(const char of passwordCharacters){
            const choseenChar = Math.floor(Math.random() * passwordCharacters.length) + 1;
            newPassword.push(choseenChar);
        };

        if(newPassword.length === 10){
            break;
        };
    };


    for(const item of newPassword){
        password += passwordCharacters[item];

        if(password.length === 9){
            break;
        };
    };
    passwordToHandle = password.slice(0,9);
    return passwordToHandle;
};

exports.options = (toEmail)=>{

    return {
        from : process.env.EMAIL,
        to : toEmail,
        subject : "Password reset",
        html : `<h1>Authentication app</h1>
        <p>Your new password is :<br>${passwordToHandle}</p>`
    };
    
};
  
//List of password characters
const passwordCharacters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
     'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 
     'Y', 'Z','a','b','c','d','e','f','g','h','e','j','k','l','m','n','o',
     'p','q','r','s','t','u','v','w','x','x','z','!','@','#','$','%','^',
     '&','*','(',')','_','-','=','+','{','}','[',']','/','?',',',':',';','<','>'];

