from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

root = Path(__file__).resolve().parents[1]
source = Path(r'C:\Users\Bren\Documents\Laboratorio5_SeguridadInformatica.docx')
destination = root / 'Laboratorio5_SeguridadInformatica_Evidencias.docx'
evidence = root / 'evidencias'

document = Document(source)

def add_heading(text, size):
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(12)
    paragraph.paragraph_format.space_after = Pt(6)
    run = paragraph.add_run(text)
    run.bold = True
    run.font.size = Pt(size)
    run.font.name = 'Arial'
    run._element.rPr.rFonts.set(qn('w:ascii'), 'Arial')
    run._element.rPr.rFonts.set(qn('w:hAnsi'), 'Arial')
    return paragraph

def add_body(text):
    paragraph = document.add_paragraph()
    paragraph.paragraph_format.space_after = Pt(6)
    run = paragraph.add_run(text)
    run.font.name = 'Arial'
    run.font.size = Pt(10.5)
    run._element.rPr.rFonts.set(qn('w:ascii'), 'Arial')
    run._element.rPr.rFonts.set(qn('w:hAnsi'), 'Arial')
    return paragraph

def add_figure(image_name, caption, width=6.25):
    image = evidence / image_name
    if not image.exists():
        raise FileNotFoundError(image)
    figure = document.add_paragraph()
    figure.alignment = WD_ALIGN_PARAGRAPH.CENTER
    figure.add_run().add_picture(str(image), width=Inches(width))
    label = document.add_paragraph()
    label.alignment = WD_ALIGN_PARAGRAPH.CENTER
    label_run = label.add_run(caption)
    label_run.italic = True
    label_run.font.size = Pt(9)

document.add_page_break()
title = document.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
title_run = title.add_run('Evidencias Laboratorio 5 UNA Chat')
title_run.bold = True
title_run.font.size = Pt(16)
title_run.font.name = 'Arial'
title_run._element.rPr.rFonts.set(qn('w:ascii'), 'Arial')
title_run._element.rPr.rFonts.set(qn('w:hAnsi'), 'Arial')

add_body('Este documento registra la corrección de la inyección de scripts, la visualización segura de imágenes y videos, y los resultados de las tres suites de prueba solicitadas para UNA Chat.')

add_heading('Implementación técnica', 13)
add_body('La librería una lib analiza cada mensaje recibido. Solo acepta URLs HTTP o HTTPS de imágenes con extensiones permitidas y enlaces válidos de YouTube. Las imágenes se crean como elementos img y los videos como iframes controlados. El texto enviado por la persona usuaria se agrega con textContent, por lo que una etiqueta script se muestra literalmente y no puede ejecutarse.')
add_body('La cobertura incluye pruebas unitarias con Mocha, pruebas de integración con Jest y socket io client sobre el evento real del servidor, y pruebas end to end con Playwright en Chrome en modo visible. La prueba de imagen confirma además que la imagen terminó de cargar mediante naturalWidth mayor que cero.')

add_heading('Evidencia 1 Inyección de script bloqueada', 13)
add_body('El payload de script se presenta como texto en el chat. No se genera una etiqueta script y no aparece ningún diálogo de alerta.')
add_figure('evidencia-1-inyeccion-bloqueada.jpg', 'Figura 1. El script se conserva como texto seguro.')

add_heading('Funcionamiento de imágenes y videos', 13)
add_body('La captura aportada muestra una imagen renderizada y un reproductor de YouTube insertado en el mismo chat. Esta evidencia corresponde al flujo funcional de usuario.')
add_figure('evidencia-funcionamiento-chat-usuario.png', 'Figura 2. Imagen y video visibles en UNA Chat.', width=6.25)

add_heading('Evidencia 2 Pruebas unitarias', 13)
add_body('Mocha ejecutó cinco casos: formato de teléfono, URL de imagen válida y no permitida, URL de YouTube, clasificación segura de medios y bloqueo de scripts.')
add_figure('evidencia-2-unitarias.jpg', 'Figura 3. Resultado de pruebas unitarias: 5 passing.')

add_heading('Evidencia 3 Pruebas de integración', 13)
add_body('Jest y socket io client verificaron la comunicación real entre el backend y una lib. Se probaron una imagen válida, un video válido y un payload de script.')
add_figure('evidencia-3-integracion.jpg', 'Figura 4. Resultado de integración: 3 pruebas aprobadas.')

add_heading('Evidencia 4 Pruebas end to end', 13)
add_body('Playwright ejecutó Chrome en modo visible. Se comprobó la carga real de una imagen, la inserción del reproductor de YouTube y la ausencia de alertas ante un script enviado por el chat.')
add_figure('evidencia-4-e2e.jpg', 'Figura 5. Resultado end to end: 3 pruebas aprobadas.')

add_heading('Resultados finales', 13)
add_body('Pruebas unitarias: 5 aprobadas. Pruebas de integración: 3 aprobadas. Pruebas end to end: 3 aprobadas. Todas las evidencias corresponden a ejecuciones locales del proyecto.')
add_body('Pendiente de entrega: agregar el enlace del repositorio GitHub en repositorio.txt, según corresponda.')

document.save(destination)
print(destination)
