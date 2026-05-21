namespace Microprojects.Edm.Domain
{
	public abstract class NamedObject : LegacyIntDomainObject
	{
		public virtual string Name { get; set; }

		#region Methods
		
		public override string ToString()
		{
			return Name;
		}

		#endregion
	}
}
