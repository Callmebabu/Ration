from django.http import HttpResponse
from weasyprint import HTML

def test_tamil_pdf_weasyprint(request):
    tamil_text = "சர்க்கரை"  # Correct Tamil word

    html_content = f"""
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil&display=swap" rel="stylesheet">
      <style>
        body {{
          font-family: 'Noto Sans Tamil', serif;
          font-size: 24pt;
        }}
      </style>
    </head>
    <body>
      <p>{tamil_text}</p>
    </body>
    </html>
    """

    pdf_file = HTML(string=html_content, base_url=request.build_absolute_uri()).write_pdf()

    response = HttpResponse(pdf_file, content_type='application/pdf')
    response['Content-Disposition'] = 'inline; filename="tamil_text.pdf"'
    return response
