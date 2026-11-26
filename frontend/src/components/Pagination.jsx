import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ pagination, onPage, onPageSize }) {
  const { page, limit, total, totalPages } = pagination;
  const pages = Math.max(1, totalPages);
  const firstPage = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from(
    { length: Math.min(5, pages) },
    (_, index) => firstPage + index,
  );

  return (
    <div className="pagination">
      <span>
        Showing{" "}
        <strong>
          {total ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)}
        </strong>{" "}
        of <strong>{total}</strong> bookings
      </span>
      <div>
        <label className="page-size">
          Rows per page{" "}
          <select
            value={limit}
            aria-label="Rows per page"
            onChange={(event) => onPageSize(Number(event.target.value))}
          >
            <option value="6">6</option>
            <option value="12">12</option>
            <option value="24">24</option>
          </select>
        </label>
        <button
          className="page-button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {numbers.map((number) => (
          <button
            key={number}
            className={`page-button ${page === number ? "current" : ""}`}
            onClick={() => onPage(number)}
            aria-label={`Page ${number}`}
            aria-current={page === number ? "page" : undefined}
          >
            {number}
          </button>
        ))}
        <button
          className="page-button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
