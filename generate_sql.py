import csv
import sys

def process_csv(filename, table_name, columns, separator=';'):
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=separator)
        for row in reader:
            vals = []
            for col in columns:
                val = row.get(col)
                if val is None or val.lower() == 'null':
                    vals.append("NULL")
                elif val.lower() == 'true':
                    vals.append("true")
                elif val.lower() == 'false':
                    vals.append("false")
                else:
                    # Escape single quotes
                    escaped = val.replace("'", "''")
                    vals.append(f"'{escaped}'")
            
            col_str = ", ".join(columns)
            val_str = ", ".join(vals)
            update_str = ", ".join([f"{c} = EXCLUDED.{c}" for c in columns if c != 'id'])
            print(f"INSERT INTO public.{table_name} ({col_str}) VALUES ({val_str}) ON CONFLICT (id) DO UPDATE SET {update_str};")

print("BEGIN;")
print("-- Attributes")
process_csv('/mnt/user-uploads/file-20', 'product_attributes', ['id', 'name', 'slug', 'created_at'])
print("-- Values")
process_csv('/mnt/user-uploads/file-18', 'product_attribute_values', ['id', 'attribute_id', 'value', 'created_at'])
print("-- Assignments")
process_csv('/mnt/user-uploads/file-19', 'product_attribute_assignments', ['id', 'product_id', 'attribute_id', 'attribute_value_id', 'used_for_variations', 'visible_on_product', 'created_at'])
print("-- Variations")
process_csv('/mnt/user-uploads/file-17', 'product_variations', ['id', 'product_id', 'sku', 'size', 'color', 'color_image', 'gallery_images', 'shop_price', 'shop_regular_price', 'retail_price', 'retail_regular_price', 'guest_price', 'regular_price', 'shop_moq', 'retail_moq', 'stock_quantity', 'weight', 'created_at'])

print("COMMIT;")
