module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.1.1"

  identifier = "opsforge-db"

  engine               = "postgres"
  engine_version       = "15"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.t3.micro"

  allocated_storage = 20

  db_name  = "opsforge"
  username = "opsforge"
  password = var.db_password
  port     = 5432

  multi_az = false

  vpc_security_group_ids = [module.vpc.default_security_group_id]

  maintenance_window = "Mon:00:00-Mon:03:00"
  backup_window      = "03:00-06:00"

  create_db_subnet_group = true
  subnet_ids             = module.vpc.private_subnets

  skip_final_snapshot = true
}
