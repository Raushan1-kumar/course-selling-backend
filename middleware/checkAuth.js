const jwt = require('jsonwebtoken');


module.exports=(req, res, next)=>{
      try{
         const token = req.headers.authorization.split(' ')[1];
         const verifiedData = jwt.verify(token,'my first project');
         next();
      }
      catch(err){
        return res.status(401).json({
            msg:"invalid token",
        })
      }
}