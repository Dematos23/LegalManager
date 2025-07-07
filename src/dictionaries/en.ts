
export const en = {
  sidebar: {
    dashboard: 'Dashboard',
    import: 'Import',
    templates: 'Templates',
    settings: 'Settings',
    language: 'Language',
    english: 'English',
    spanish: 'Spanish',
  },
  dashboard: {
    title: 'Trademark Dashboard',
    noTrademarks: 'Your trademarks will appear here once you connect to a database and import data via the Import page.',
    expiring30: 'Expiring in 30 days',
    expiring60: 'Expiring in 60 days',
    expiring90: 'Expiring in 90 days',
    clearFilters: 'Clear Filters',
    searchPlaceholder: 'Search trademarks...',
    table: {
      trademark: 'Trademark',
      owner: 'Owner',
      class: 'Class',
      expiration: 'Expiration',
      contact: 'Contact',
      agent: 'Agent',
      actions: 'Actions',
      noResults: 'No results.',
      previous: 'Previous',
      next: 'Next',
    },
    actions: {
        generateEmail: 'Generate Email'
    }
  },
  import: {
    title: 'Import Trademarks',
    uploadTitle: '1. Upload Excel File',
    uploadDescription: 'Import data from an .xlsx file. The first row should contain the column headers.',
    fileDrop: 'Drag & drop your file here or click to browse',
    parsingFile: 'Parsing file...',
    mapTitle: '2. Map Columns',
    mapDescription: 'Match the columns from your file to the corresponding fields in the database.',
    dbField: 'Database Field',
    fileColumn: 'File Column Header',
    ignoreOption: '-- Ignore this column --',
    importTitle: '3. Import',
    importDescription: 'Once columns are mapped, process the file to import the data.',
    importButton: 'Process & Import Data',
    importingButton: 'Importing...',
    importResultTitle: 'Import Result'
  },
  templates: {
    title: 'Email Templates',
    createButton: 'Create Template',
    cardTitle: 'Your Templates',
    cardDescription: 'Manage your email templates for client communication.',
    table: {
        name: 'Name',
        subject: 'Subject',
        lastUpdated: 'Last Updated',
        actions: 'Actions',
        noTemplates: 'No templates found.',
        edit: 'Edit',
        delete: 'Delete'
    },
    deleteDialog: {
        title: 'Are you sure?',
        description: 'This action cannot be undone. This will permanently delete the template.',
        cancel: 'Cancel',
        continue: 'Continue',
    }
  },
  templateForm: {
    createTitle: 'Create New Template',
    editTitle: 'Edit Template',
    description: 'Design your email template. Use the merge fields to personalize your emails.',
    nameLabel: 'Template Name',
    namePlaceholder: "e.g., 'Trademark Renewal Notice'",
    subjectLabel: 'Email Subject',
    subjectPlaceholder: 'Your Subject Line',
    bodyLabel: 'Email Body',
    createButton: 'Create Template',
    updateButton: 'Update Template',
    mergeFieldsTitle: 'Merge Fields',
    mergeFieldsDescription: 'Click to copy a merge field to your clipboard.',
    copied: 'Copied to clipboard',
  },
  emailModal: {
    title: 'Generated Email Draft',
    description: 'Review and edit the AI-generated email below.',
    close: 'Close',
    copy: 'Copy HTML',
    send: 'Send Email',
    sentToast: 'Email Sent (Simulated)',
    sentToastDesc: 'An email has been sent to'
  }
};

export type Dictionary = typeof en;
