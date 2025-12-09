-- Grant ALTER privilege to kmbruce user so they can modify the table
-- This needs to be run as postgres superuser
GRANT ALL PRIVILEGES ON TABLE products TO kmbruce;
ALTER TABLE products OWNER TO kmbruce;

