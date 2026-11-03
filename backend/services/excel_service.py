import os
import re
import csv
import io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
PHONE_REGEX = re.compile(r'^\+?[0-9]{7,15}$')

def validate_student_row(row_dict, row_num):
    errors = []
    
    student_id = str(row_dict.get('student_id', '')).strip()
    name = str(row_dict.get('name', '')).strip()
    college = str(row_dict.get('college', '')).strip()
    department = str(row_dict.get('department', '')).strip()
    year = str(row_dict.get('year', '')).strip()
    email = str(row_dict.get('email', '')).strip()
    phone = str(row_dict.get('phone', '')).strip()

    if not student_id:
        errors.append("Student ID is required.")
    if not name:
        errors.append("Student Name is required.")
    if not college:
        errors.append("College name is required.")
    if not department:
        errors.append("Department is required.")
    if not year:
        errors.append("Year of study is required.")
    
    if not email:
        errors.append("Email is required.")
    elif not EMAIL_REGEX.match(email):
        errors.append(f"Invalid email format: '{email}'.")

    if not phone:
        errors.append("Phone number is required.")
    elif not PHONE_REGEX.match(phone.replace('-', '').replace(' ', '')):
        errors.append(f"Invalid phone number: '{phone}' (must be 7-15 digits).")

    cleaned_data = {
        'student_id': student_id,
        'name': name,
        'college': college,
        'department': department,
        'year': year,
        'email': email,
        'phone': phone
    }

    return cleaned_data, errors

def parse_bulk_file(file_stream, filename):
    """
    Parses an uploaded CSV or XLSX file and validates every row.
    Returns: {
        'total_rows': int,
        'valid_rows': list[dict],
        'invalid_rows': list[dict]
    }
    """
    valid_rows = []
    invalid_rows = []
    ext = filename.rsplit('.', 1)[-1].lower()

    if ext == 'csv':
        content = file_stream.read()
        if isinstance(content, bytes):
            content = content.decode('utf-8', errors='ignore')
        reader = csv.DictReader(io.StringIO(content))
        row_num = 1
        for row in reader:
            row_num += 1
            # Normalize dict keys (lowercase and stripped)
            norm_row = {str(k).strip().lower(): v for k, v in row.items() if k is not None}
            data, errors = validate_student_row(norm_row, row_num)
            if errors:
                invalid_rows.append({
                    'row_number': row_num,
                    'raw_data': norm_row,
                    'errors': errors
                })
            else:
                valid_rows.append(data)

    elif ext == 'xlsx':
        wb = openpyxl.load_workbook(file_stream, data_only=True)
        sheet = wb.active
        headers = []
        for col_idx in range(1, sheet.max_column + 1):
            val = sheet.cell(row=1, column=col_idx).value
            headers.append(str(val).strip().lower() if val is not None else '')

        for row_idx in range(2, sheet.max_row + 1):
            row_dict = {}
            has_data = False
            for col_idx, header in enumerate(headers, start=1):
                cell_val = sheet.cell(row=row_idx, column=col_idx).value
                if cell_val is not None:
                    has_data = True
                row_dict[header] = cell_val if cell_val is not None else ''

            if not has_data:
                continue

            data, errors = validate_student_row(row_dict, row_idx)
            if errors:
                invalid_rows.append({
                    'row_number': row_idx,
                    'raw_data': row_dict,
                    'errors': errors
                })
            else:
                valid_rows.append(data)
    else:
        raise ValueError(f"Unsupported file format: .{ext}")

    return {
        'total_rows': len(valid_rows) + len(invalid_rows),
        'valid_count': len(valid_rows),
        'invalid_count': len(invalid_rows),
        'valid_rows': valid_rows,
        'invalid_rows': invalid_rows
    }

def create_sample_excel():
    """
    Creates a styled sample Excel file with instructions and sample rows.
    Returns bytes of the xlsx file.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Students Template"

    headers = ["student_id", "name", "college", "department", "year", "email", "phone"]
    
    # Styles
    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    sample_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")

    ws.append(headers)
    for col_num in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    sample_rows = [
        ["STU2026101", "Aditya Verma", "Apex Institute of Technology", "Computer Science", "3rd Year", "aditya.v@example.com", "9876500001"],
        ["STU2026102", "Ananya Deshmukh", "Apex Institute of Technology", "Information Technology", "4th Year", "ananya.d@example.com", "9876500002"],
        ["STU2026103", "Karan Singhania", "Apex Institute of Technology", "Mechanical Engineering", "2nd Year", "karan.s@example.com", "9876500003"],
        ["STU2026104", "Sneha Roy", "Apex Institute of Technology", "Electrical and Electronics", "3rd Year", "sneha.roy@example.com", "9876500004"]
    ]

    for r_idx, row in enumerate(sample_rows, start=2):
        ws.append(row)
        for c_idx in range(1, len(row) + 1):
            cell = ws.cell(row=r_idx, column=c_idx)
            cell.alignment = Alignment(vertical="center")

    # Column widths
    col_widths = [16, 22, 32, 24, 14, 26, 16]
    for i, w in enumerate(col_widths, start=1):
        col_letter = openpyxl.utils.get_column_letter(i)
        ws.column_dimensions[col_letter].width = w

    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    return out.getvalue()
