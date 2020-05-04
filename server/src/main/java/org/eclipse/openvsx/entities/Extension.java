/********************************************************************************
 * Copyright (c) 2019 TypeFox and others
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ********************************************************************************/
package org.eclipse.openvsx.entities;

import java.time.ZoneOffset;
import java.util.List;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;

import org.eclipse.openvsx.search.ExtensionSearch;

@Entity
public class Extension {

    @Id
    @GeneratedValue
    Long id;

    String name;

    @ManyToOne
    Namespace namespace;

    @OneToMany(mappedBy = "extension")
    List<ExtensionVersion> versions;

    @OneToOne
    ExtensionVersion latest;

    Double averageRating;

    int downloadCount;


    /**
     * Convert to a search entity for Elasticsearch.
     */
    public ExtensionSearch toSearch() {
        var search = new ExtensionSearch();
        search.id = this.getId();
        search.name = this.getName();
        search.namespace = this.getNamespace().getName();
        search.averageRating = this.getAverageRating();
        search.downloadCount = this.getDownloadCount();
        var extVer = this.getLatest();
        search.displayName = extVer.getDisplayName();
        search.description = extVer.getDescription();
        search.timestamp = extVer.getTimestamp().toEpochSecond(ZoneOffset.UTC);
        search.categories = extVer.getCategories();
        search.tags = extVer.getTags();
        return search;
    }

    public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Namespace getNamespace() {
		return namespace;
    }
    
    public List<ExtensionVersion> getVersions() {
        return versions;
    }

	public void setNamespace(Namespace namespace) {
		this.namespace = namespace;
	}

	public ExtensionVersion getLatest() {
		return latest;
	}

	public void setLatest(ExtensionVersion latest) {
		this.latest = latest;
	}

	public Double getAverageRating() {
		return averageRating;
	}

	public void setAverageRating(Double averageRating) {
		this.averageRating = averageRating;
    }

    public int getDownloadCount() {
        return downloadCount;
    }

    public void setDownloadCount(int downloadCount) {
        this.downloadCount = downloadCount;
    }

}