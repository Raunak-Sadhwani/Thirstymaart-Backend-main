const express = require('express');
const router = express.Router();
const ProductAnalysis = require('../models/ProductClick');
const Vendor = require('../models/Vendor'); 
const Product = require('../models/Products');

// Track product clicks 

router.post('/track-click', async (req, res) => {
  try {
    const { productId, buttonName } = req.body;
    const currentDate = new Date().toDateString(); // Get the current date as a string

    // Find the product information based on the provided productId
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(400).json({ message: 'Product not found' });
    }

    const vendorId = product.vendor; // Get the vendor ID from the product document

    // Find an entry for the product, current date, and vendor
    let analysisEntry = await ProductAnalysis.findOne({
      productId,
      date: currentDate,
      vendor: vendorId,
    });

    // If no entry exists, create a new one
    if (!analysisEntry) {
      analysisEntry = new ProductAnalysis({
        productId,
        date: currentDate,
        vendor: vendorId,
        shareClick: 0,
        whatsappClick: 0,
        callClick: 0,
        profileClick: 0,
        enquireClick: 0,
      });
    }

    // Update the analysisEntry based on the buttonName
    switch (buttonName) {
      case 'share':
        analysisEntry.shareClick++;
        break;
      case 'whatsapp':
        analysisEntry.whatsappClick++;
        break;
      case 'call':
        analysisEntry.callClick++;
        break;
      case 'profile':
        analysisEntry.profileClick++;
        break;
      case 'enquire':
        analysisEntry.enquireClick++;
        break;
      default:
        return res.status(400).json({ message: 'Invalid buttonName' });
    }

    await analysisEntry.save(); // Save the updated analysisEntry to the database

    return res.json({ message: 'Product click tracked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/get-data-for-date', async (req, res) => {
  try {
    const { vendorId, startDate } = req.body;

    // Find all product analysis entries for the specified vendor and date
    const data = await ProductAnalysis.find({
      vendor: vendorId,
      date: new Date(startDate).toDateString(),
    });

    if (data.length > 0) {
      // If data is found, calculate the total counts for each button
      let totalShareClick = 0;
      let totalWhatsappClick = 0;
      let totalCallClick = 0;
      let totalProfileClick = 0;
      let totalEnquireClick = 0;

      data.forEach((entry) => {
        totalShareClick += entry.shareClick;
        totalWhatsappClick += entry.whatsappClick;
        totalCallClick += entry.callClick;
        totalProfileClick += entry.profileClick;
        totalEnquireClick += entry.enquireClick;
      });

      res.json({
        shareClick: totalShareClick,
        whatsappClick: totalWhatsappClick,
        callClick: totalCallClick,
        profileClick: totalProfileClick,
        enquireClick: totalEnquireClick,
      });
    } else {
      // If no data is found, return a response indicating that there's no data for the specified date and vendor
      res.status(404).json({ error: 'No data available for the specified date and vendor' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/get-data-for-week', async (req, res) => {
  try {
    const { vendorId, startDate } = req.body;

    const currentEndDate = new Date(startDate);
    currentEndDate.setDate(currentEndDate.getDate() + 6); // Calculate the end date for the current week

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - 7); // Calculate the start date for the previous week
    const previousEndDate = new Date(previousStartDate);
    previousEndDate.setDate(previousEndDate.getDate() + 6); // Calculate the end date for the previous week

    // Find all product analysis entries for the specified vendor within the date range for both current and previous weeks
    const currentWeekData = await ProductAnalysis.find({
      vendor: vendorId,
      date: {
        $gte: new Date(startDate),
        $lte: currentEndDate,
      },
    });

    const previousWeekData = await ProductAnalysis.find({
      vendor: vendorId,
      date: {
        $gte: previousStartDate,
        $lte: previousEndDate,
      },
    });

    const result = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const formattedDate = currentDate.toDateString();

      const dayData = {
        day: formattedDate.substr(0, 3).toLowerCase(), // Abbreviated day name (e.g., "mon")
        date: currentDate.toISOString(), // Include the full date
        share: 0,
        call: 0,
        whatsapp: 0,
        profile: 0,
        enquire: 0,
        prevshare: 0,
        prevcall: 0,
        prevwhatsapp: 0,
        prevprofile: 0,
        prevenquire: 0,
      };

      // Calculate the button clicks for the current week
      const currentWeekAnalysis = currentWeekData.filter((entry) => entry.date.toDateString() === formattedDate);
      if (currentWeekAnalysis.length > 0) {
        currentWeekAnalysis.forEach((entry) => {
          dayData.share += entry.shareClick;
          dayData.call += entry.callClick;
          dayData.whatsapp += entry.whatsappClick;
          dayData.profile += entry.profileClick;
          dayData.enquire += entry.enquireClick;
        });
      }

      // Calculate the button clicks for the previous week
      const previousWeekAnalysis = previousWeekData.filter((entry) => entry.date.toDateString() === formattedDate);
      if (previousWeekAnalysis.length > 0) {
        previousWeekAnalysis.forEach((entry) => {
          dayData.prevshare += entry.shareClick;
          dayData.prevcall += entry.callClick;
          dayData.prevwhatsapp += entry.whatsappClick;
          dayData.prevprofile += entry.profileClick;
          dayData.prevenquire += entry.enquireClick;
        });
      }

      result.push(dayData);
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get data for a date range of a month (30 days)
router.post('/get-data-for-month', async (req, res) => {
  try {
    const { vendorId, startDate } = req.body;

    const currentMonthStartDate = new Date(startDate);
    currentMonthStartDate.setDate(1); // Set the start date to the first day of the month

    // Calculate the end date for the current month
    const currentMonthEndDate = new Date(currentMonthStartDate);
    currentMonthEndDate.setMonth(currentMonthEndDate.getMonth() + 1);
    currentMonthEndDate.setDate(currentMonthEndDate.getDate() - 1);

    const previousMonthStartDate = new Date(currentMonthStartDate);
    previousMonthStartDate.setMonth(previousMonthStartDate.getMonth() - 1); // Calculate the start date for the previous month

    const previousMonthEndDate = new Date(currentMonthStartDate);
    previousMonthEndDate.setDate(0); // Set the end date to the last day of the previous month

    // Find all product analysis entries for the specified vendor within the date range for both current and previous months
    const currentMonthData = await ProductAnalysis.find({
      vendor: vendorId,
      date: {
        $gte: currentMonthStartDate,
        $lte: currentMonthEndDate,
      },
    });

    const previousMonthData = await ProductAnalysis.find({
      vendor: vendorId,
      date: {
        $gte: previousMonthStartDate,
        $lte: previousMonthEndDate,
      },
    });

    const result = [];

    // Calculate the number of days in the current month
    const numDaysInCurrentMonth = (currentMonthEndDate - currentMonthStartDate) / (1000 * 60 * 60 * 24) + 1;

    for (let i = 0; i < numDaysInCurrentMonth; i++) {
      const currentDate = new Date(currentMonthStartDate);
      currentDate.setDate(currentMonthStartDate.getDate() + i);
      const formattedDate = currentDate.toDateString();

      const dayData = {
        day: formattedDate.substr(0, 3).toLowerCase(), // Abbreviated day name (e.g., "mon")
        date: currentDate.toISOString(), // Include the full date
        share: 0,
        call: 0,
        whatsapp: 0,
        profile: 0,
        enquire: 0,
        prevshare: 0,
        prevcall: 0,
        prevwhatsapp: 0,
        prevprofile: 0,
        prevenquire: 0,
      };

      // Calculate the button clicks for the current month
      const currentMonthAnalysis = currentMonthData.filter((entry) => entry.date.toDateString() === formattedDate);
      if (currentMonthAnalysis.length > 0) {
        currentMonthAnalysis.forEach((entry) => {
          dayData.share += entry.shareClick;
          dayData.call += entry.callClick;
          dayData.whatsapp += entry.whatsappClick;
          dayData.profile += entry.profileClick;
          dayData.enquire += entry.enquireClick;
        });
      }

      // Calculate the button clicks for the previous month
      const previousMonthAnalysis = previousMonthData.filter((entry) => entry.date.toDateString() === formattedDate);
      if (previousMonthAnalysis.length > 0) {
        previousMonthAnalysis.forEach((entry) => {
          dayData.prevshare += entry.shareClick;
          dayData.prevcall += entry.callClick;
          dayData.prevwhatsapp += entry.whatsappClick;
          dayData.prevprofile += entry.profileClick;
          dayData.prevenquire += entry.enquireClick;
        });
      }

      result.push(dayData);
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/top-products', async (req, res) => {
  try {
    const { vendorId, date } = req.body;

    // Parse the provided date to a Date object
    const selectedDate = new Date(date);

    // Calculate the start and end dates for the selected day
    const dayStartDate = new Date(selectedDate);
    dayStartDate.setHours(0, 0, 0, 0); // Start of the day
    const dayEndDate = new Date(selectedDate);
    dayEndDate.setHours(23, 59, 59, 999); // End of the day

    // Find the top 5 products for the selected day based on combined traffic
    const topProductsDay = await ProductAnalysis.aggregate([
      {
        $match: {
          vendor: vendorId,
          date: {
            $gte: dayStartDate,
            $lte: dayEndDate,
          },
        },
      },
      {
        $group: {
          _id: '$productId',
          totalTraffic: {
            $sum: {
              $add: ['$shareClick', '$callClick', '$whatsappClick', '$profileClick', '$enquireClick'],
            },
          },
        },
      },
      {
        $sort: { totalTraffic: -1 }, // Sort by combined traffic in descending order
      },
      {
        $limit: 5,
      },
    ]);

    res.json(topProductsDay);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});








module.exports = router;
