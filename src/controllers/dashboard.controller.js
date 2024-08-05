const screen = require("../models/newScreen.model");
const library = require("../models/library.model");

const logdetails = require("../models/log.model");

const showAllDashboardData=async (req, res) => {

    const totalScreenCount= await screen.getTotalScreenCount();
    const onlineScreenCount=await screen.getNotDeletedScreenCount();
    const deletedScreenCount=await screen.getDeletedScreenCount();
    const totalMediaFiles=await library.getmediafileCount();

    const allScreens =await screen.getNotdeletedScreen();
    const logs =await logdetails.logData();
 
  
    // try {
    //     const logs = await Log.findAll({
    //       order: [['createdAt', 'DESC']],
    //       limit: 5
    //     });
    //     res.render('showdashboard', { logs });
    //   } catch (error) {
    //     console.error('Error fetching logs:', error);
    //     req.flash('error_msg', 'Error fetching dashboard data. Please try again.');
    //     res.redirect('/Dashboard');
    //   }
// console.log(totalScreenCount,onlineScreenCount,deletedScreenCount,totalMediaFiles,allScreens,logs);
    res.render("showdashboard",{totalScreenCount,onlineScreenCount,deletedScreenCount,totalMediaFiles,allScreens,logs});
}

module.exports={
    showAllDashboardData
}