-- Create a function to recalculate the property rating based on user posts (reviews)
create or replace function update_property_rating()
returns trigger as $$
begin
  -- Update the NEW property (for insert/update)
  if (TG_OP = 'INSERT' or TG_OP = 'UPDATE') and NEW.property_id is not null then
    update properties
    set 
      rating = (select round(avg(rating)::numeric, 2) from posts where property_id = NEW.property_id and rating is not null),
      reviews = (select count(*) from posts where property_id = NEW.property_id and rating is not null)
    where id = NEW.property_id;
  end if;
  
  -- Update the OLD property (for update when property_id changes, or delete)
  if (TG_OP = 'DELETE' and OLD.property_id is not null) or (TG_OP = 'UPDATE' and OLD.property_id is not null and OLD.property_id != NEW.property_id) then
    update properties
    set 
      rating = (select round(avg(rating)::numeric, 2) from posts where property_id = OLD.property_id and rating is not null),
      reviews = (select count(*) from posts where property_id = OLD.property_id and rating is not null)
    where id = OLD.property_id;
  end if;

  return null;
end;
$$ language plpgsql;

-- Create the trigger on posts
drop trigger if exists update_property_rating_trigger on posts;
create trigger update_property_rating_trigger
after insert or update or delete on posts
for each row execute function update_property_rating();
