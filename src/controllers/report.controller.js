const reportService = require('../services/report.service');
const { generateReportPDF } = require('../utils/pdfGenerator');

const generateReport = async (req, res, next) => {
  try {
    const { month, year } = req.validatedBody;
    const report = await reportService.generateReport(month, year, req.user.id);
    res.status(201).json({ message: 'Report generated', report });
  } catch (err) {
    next(err);
  }
};

const getReports = async (req, res, next) => {
  try {
    const reports = await reportService.getReports();
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const report = await reportService.updateReport(req.params.id, req.validatedBody);
    res.json({ message: 'Report updated', report });
  } catch (err) {
    next(err);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    await reportService.deleteReport(req.params.id);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    next(err);
  }
};

const downloadPDF = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${report.month}-${report.year}.pdf"`);

    generateReportPDF(report, res);
  } catch (err) {
    next(err);
  }
};

module.exports = { generateReport, getReports, getReportById, updateReport, deleteReport, downloadPDF };
