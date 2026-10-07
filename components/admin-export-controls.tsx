type Report = 'donations' | 'blog' | 'enquiries';

export function AdminExportControls({ report, fromDate, toDate }: { report: Report; fromDate: string; toDate: string }) {
  return <form className="admin-export-controls" action="/api/admin/export" method="get">
    <input type="hidden" name="type" value={report}/>
    <label>From<input name="from" type="date" defaultValue={fromDate} max={toDate} required/></label>
    <label>To<input name="to" type="date" defaultValue={toDate} min={fromDate} max={toDate} required/></label>
    <button className="admin-secondary-button" type="submit">Export CSV</button>
  </form>;
}
