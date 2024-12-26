import os
import time
import requests
from pyunpack import Archive
import json
import psycopg2
from psycopg2.extras import execute_batch
from pathlib import Path

def download_and_extract(download_url, download_dir, extract_dir):
    # Crear las carpetas de descarga y extracción si no existen
    os.makedirs(download_dir, exist_ok=True)
    os.makedirs(extract_dir, exist_ok=True)

    # Nombre fijo para el archivo descargado
    rar_filename = "latest_downloaded.rar"
    rar_filepath = os.path.join(download_dir, rar_filename)

    try:
        # Descargar el archivo desde la URL
        print(f"Descargando desde {download_url}...")
        response = requests.get(download_url, stream=True)
        response.raise_for_status()  # Verifica si hubo un error en la descarga

        # Guardar el contenido descargado
        with open(rar_filepath, 'wb') as rar_file:
            for chunk in response.iter_content(chunk_size=8192):
                rar_file.write(chunk)

        print(f"Archivo descargado exitosamente en {rar_filepath}")

        # Extraer el contenido del archivo RAR
        print(f"Extrayendo contenido en {extract_dir}...")
        Archive(rar_filepath).extractall(extract_dir)

        print(f"Extracción completada. Archivos extraídos en {extract_dir}")

    except Exception as e:
        print(f"Error durante la descarga o extracción: {e}")

def process_json_and_insert_to_db(json_dir, dsn):
    # Encontrar el archivo JSON en el directorio descomprimido
    json_files = [f for f in os.listdir(json_dir) if f.endswith('.json')]
    if not json_files:
        print("No se encontró ningún archivo JSON en el directorio extraído.")
        return

    input_file = os.path.join(json_dir, json_files[0])
    print(f"Procesando archivo JSON: {input_file}")

    # Cargar el JSON
    with open(input_file, encoding='utf-8') as file:
        data = json.load(file)

    records = data.get('records', [])

    # Inicializar contadores de inserciones
    insert_counts = {
        "compiled_releases": 0,
        "parties": 0,
        "buyers": 0,
        "tenders": 0,
        "items": 0,
        "documents": 0,
        "tenderers": 0,
        "planning": 0
    }

    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor()
        print("Conexión a la base de datos exitosa.")

        # Procesar e insertar datos en la base de datos
        for record in records:
            cr = record.get('compiledRelease', {})

        # Insertar en compiled_releases
            compiled_id = cr.get('id')  # El id original del registro, para usar como referencia adicional
            ocid = cr.get('ocid')  # El ocid inmutable, usado como identificador principal

            if ocid:
                cursor.execute("SELECT 1 FROM compiled_releases WHERE id = %s", (ocid,))
                if not cursor.fetchone():
                    cursor.execute(
                        """
                        INSERT INTO compiled_releases (id, ocid, date, published_date, initiation_type)
                        VALUES (%s, %s, %s, %s, %s);
                        """,
                        (
                            ocid,  # Usamos el ocid como id principal
                            compiled_id,  # Guardamos el id original en la columna ocid
                            cr.get('date'),
                            cr.get('publishedDate'),
                            cr.get('initiationType'),
                        ),
                    )
                    insert_counts["compiled_releases"] += 1

            # Insertar en parties
            for party in cr.get('parties', []):
                party_id = party.get('id')
                if party_id:
                    date_published = cr.get('tender', {}).get('datePublished')  # Obtener datePublished
                    cursor.execute("SELECT 1 FROM parties WHERE id = %s", (party_id,))
                    if not cursor.fetchone():
                        cursor.execute(
                            """
                            INSERT INTO parties (id, name, identifier_scheme, identifier_id, legal_name, street_address, locality, region, department, country_name, roles, date_published)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (id) DO UPDATE SET date_published = EXCLUDED.date_published;
                            """,
                            (
                                party_id,
                                party.get('name'),
                                party.get('identifier', {}).get('scheme'),
                                party.get('identifier', {}).get('id'),
                                party.get('identifier', {}).get('legalName'),
                                party.get('address', {}).get('streetAddress'),
                                party.get('address', {}).get('locality'),
                                party.get('address', {}).get('region'),
                                party.get('address', {}).get('department'),
                                party.get('address', {}).get('countryName'),
                                ", ".join(party.get('roles', [])),
                                date_published,
                            ),
                        )
                        insert_counts["parties"] += 1
            # Insertar en buyers
            buyer = cr.get('buyer', {})
            buyer_id = buyer.get('id')
            if buyer_id:
                cursor.execute("SELECT 1 FROM buyers WHERE id = %s", (buyer_id,))
                if not cursor.fetchone():
                    cursor.execute(
                        """
                        INSERT INTO buyers (id, name)
                        VALUES (%s, %s);
                        """,
                        (
                            buyer_id,
                            buyer.get('name'),
                        ),
                    )
                    insert_counts["buyers"] += 1

            # Insertar en tenders
            tender = cr.get('tender', {})
            tender_id = tender.get('id')
            if tender_id:
                cursor.execute("SELECT 1 FROM tenders WHERE id = %s", (tender_id,))
                if not cursor.fetchone():
                    procurement_method = tender.get('procurementMethod') or 'unknown'  # Valor por defecto
                    cursor.execute(
                        """
                        INSERT INTO tenders (id, compiled_release_id, buyer_id, title, description, procurement_method, procurement_method_details, main_procurement_category, number_of_tenderers, currency, value_amount, date_published)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                        """,
                        (
                            tender_id,
                            ocid,
                            tender.get('procuringEntity', {}).get('id') or buyer_id,
                            tender.get('title'),
                            tender.get('description'),
                            procurement_method,
                            tender.get('procurementMethodDetails'),
                            tender.get('mainProcurementCategory'),
                            tender.get('numberOfTenderers', 0),
                            tender.get('value', {}).get('currency', 'PEN'),
                            tender.get('value', {}).get('amount', 0.0),
                            tender.get('datePublished'),
                        ),
                    )
                    insert_counts["tenders"] += 1

            # Insertar en items
            for item in tender.get('items', []):
                item_id = item.get('id')
                if item_id:
                    cursor.execute("SELECT 1 FROM items WHERE id = %s", (item_id,))
                    if not cursor.fetchone():
                        cursor.execute(
                            """
                            INSERT INTO items (id, tender_id, description, status, classification_id, classification_description, quantity, unit_id, unit_name, total_value_amount)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                            """,
                            (
                                item_id,
                                tender_id,
                                item.get('description'),
                                item.get('status'),
                                item.get('classification', {}).get('id'),
                                item.get('classification', {}).get('description'),
                                item.get('quantity', 0.0),
                                item.get('unit', {}).get('id'),
                                item.get('unit', {}).get('name'),
                                item.get('totalValue', {}).get('amount', 0.0),
                            ),
                        )
                        insert_counts["items"] += 1

            # Insertar en documents
            for document in tender.get('documents', []):
                document_id = document.get('id')
                if document_id:
                    cursor.execute("SELECT 1 FROM documents WHERE id = %s", (document_id,))
                    if not cursor.fetchone():
                        cursor.execute(
                            """
                            INSERT INTO documents (id, tender_id, url, date_published, format, document_type, title, language)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                            """,
                            (
                                document_id,
                                tender_id,
                                document.get('url'),
                                document.get('datePublished'),
                                document.get('format'),
                                document.get('documentType'),
                                document.get('title'),
                                document.get('language'),
                            ),
                        )
                        insert_counts["documents"] += 1

            # Insertar en tenderers
            for tenderer in tender.get('tenderers', []):
                tenderer_id = tenderer.get('id')
                if tenderer_id:
                    cursor.execute("SELECT 1 FROM tenderers WHERE id = %s AND tender_id = %s", (tenderer_id, tender_id))
                    if not cursor.fetchone():
                        cursor.execute(
                            """ 
                            INSERT INTO tenderers (id, tender_id, name)
                            VALUES (%s, %s, %s);
                            """,
                            (
                                tenderer_id,
                                tender_id,
                                tenderer.get('name'),
                            ),
                        )
                        insert_counts["tenderers"] += 1

            # Insertar en planning
            planning = cr.get('planning', {})
            if compiled_id:
                cursor.execute("SELECT 1 FROM planning WHERE compiled_release_id = %s", (compiled_id,))
                if not cursor.fetchone():
                    cursor.execute(
                        """
                        INSERT INTO planning (compiled_release_id, budget_description)
                        VALUES (%s, %s)
                        ON CONFLICT (compiled_release_id) DO NOTHING;
                        """,
                        (
                            ocid,
                            planning.get('budget', {}).get('description'),
                        ),
                    )
                    if cursor.rowcount > 0:
                     insert_counts["planning"] += 1

        # Confirmar los cambios en la base de datos
        conn.commit()
        print("Datos insertados exitosamente en la base de datos.")

        # Mostrar el resumen de inserciones
        print("Resumen de inserciones:")
        for table, count in insert_counts.items():
            print(f"- {table}: {count} nuevas entradas")

    except Exception as e:
        print(f"Error durante la inserción en la base de datos: {e}")
        if conn:
            conn.rollback()

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    DOWNLOAD_URL = 'https://contratacionesabiertas.osce.gob.pe/api/v1/file/seace_v3/json/2024/12/'
    DOWNLOAD_DIR = 'D:/User/Frentz/Downloads/AUTOMATIZACION/ctc_dwn'
    EXTRACT_DIR = 'D:/User/Frentz/Downloads/AUTOMATIZACION/extracted_files'
    DSN = "postgresql://postgres:040502@127.0.0.1:5432/DBLunes"
    # Descargar y extraer el archivo
    download_and_extract(DOWNLOAD_URL, DOWNLOAD_DIR, EXTRACT_DIR)
    # Procesar JSON e insertar en la base de datos
    process_json_and_insert_to_db(EXTRACT_DIR, DSN)