import {
  createManualTimeEntry,
  type ManualTimeEntryInput,
  type TimeEntry,
  type TimeEntryRepository,
} from "./index.js";

export interface InvalidCsvRow {
  readonly row: number;
  readonly reason: string;
  readonly values: Readonly<Record<string, string>>;
}

export interface CsvImportResult {
  readonly imported: readonly TimeEntry[];
  readonly invalid: readonly InvalidCsvRow[];
}

export interface CsvImportService {
  import(csv: string, projectIdForName?: (name: string) => string | undefined): CsvImportResult;
}

export function createCsvImportService(entries: TimeEntryRepository): CsvImportService {
  return {
    import(csv: string, projectIdForName?: (name: string) => string | undefined): CsvImportResult {
      const rows = parseCsv(csv);
      if (rows.length === 0) {
        return { imported: [], invalid: [] };
      }
      const [headers, ...dataRows] = rows;
      if (!headers) {
        return { imported: [], invalid: [] };
      }
      const imported: TimeEntry[] = [];
      const invalid: InvalidCsvRow[] = [];
      for (const [index, row] of dataRows.entries()) {
        const values: Record<string, string> = {};
        for (const [column, header] of headers.entries()) {
          values[header] = row[column] ?? "";
        }
        try {
          const projectId = values.projectId || (values.projectName ? projectIdForName?.(values.projectName) : undefined);
          if (!projectId && values.projectName) {
            throw new Error("project mapping is required");
          }
          const entry = createManualTimeEntry(toManualInput(values, projectId), {
            existingEntries: [...entries.findAll(), ...imported],
          });
          entries.save(entry);
          imported.push(entry);
        } catch (error) {
          invalid.push({
            row: index + 2,
            reason: error instanceof Error ? error.message : "invalid row",
            values,
          });
        }
      }
      return { imported, invalid };
    },
  };
}

function toManualInput(values: Readonly<Record<string, string>>, projectId: string | undefined): ManualTimeEntryInput {
  const base = {
    id: requiredValue(values, "id"),
    userId: requiredValue(values, "userId"),
    ...(projectId === undefined ? {} : { projectId }),
  };
  const endAt = new Date(values.endAt ?? "");
  if (Number.isNaN(endAt.getTime())) {
    throw new Error("endAt is invalid");
  }
  if (values.durationMinutes) {
    return { ...base, endAt, durationMinutes: Number(values.durationMinutes) };
  }
  const startAt = new Date(values.startAt ?? "");
  if (Number.isNaN(startAt.getTime())) {
    throw new Error("startAt is invalid");
  }
  return { ...base, startAt, endAt };
}

function requiredValue(values: Readonly<Record<string, string>>, field: string): string {
  const value = values[field];
  if (!value) {
    throw new Error(`${field} is required`);
  }
  return value;
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index] as string;
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[index + 1] === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (quoted) {
    throw new Error("unterminated quoted value");
  }
  row.push(cell);
  if (row.some((value) => value !== "")) {
    rows.push(row);
  }
  return rows;
}
